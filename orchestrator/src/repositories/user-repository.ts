import pino from 'pino';
import { db } from '../db/index.js';
import { authService } from '../services/auth-service.js';
import type { User, UserRole } from '../types/user.js';

const log = pino();

export class UserRepository {
  /**
   * Create a new user
   */
  async create(user: {
    email: string;
    name: string;
    password: string;
    role: UserRole;
    dealershipIds: string[];
  }): Promise<User> {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Hash password
      const passwordHash = await authService.hashPassword(user.password);

      // Insert user
      const userResult = await client.query(
        `INSERT INTO users (email, name, password_hash, role, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id, email, name, role, is_active, created_at, updated_at`,
        [user.email, user.name, passwordHash, user.role, true]
      );

      const userId = userResult.rows[0].id;

      // Insert dealership assignments
      for (const dealershipId of user.dealershipIds) {
        await client.query(
          `INSERT INTO user_dealerships (user_id, dealership_id)
           VALUES ($1, $2)`,
          [userId, dealershipId]
        );
      }

      await client.query('COMMIT');

      return {
        id: userId,
        email: user.email,
        name: user.name,
        role: user.role,
        dealershipIds: user.dealershipIds,
        isActive: true,
        createdAt: userResult.rows[0].created_at,
        updatedAt: userResult.rows[0].updated_at
      };
    } catch (error) {
      await client.query('ROLLBACK');
      log.error('Failed to create user:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    const result = await db.query(
      `SELECT u.id, u.email, u.name, u.role, u.password_hash as "passwordHash", 
              u.is_active as "isActive", u.created_at as "createdAt", u.updated_at as "updatedAt",
              array_agg(ud.dealership_id) as dealership_ids
       FROM users u
       LEFT JOIN user_dealerships ud ON u.id = ud.user_id
       WHERE u.email = $1
       GROUP BY u.id`,
      [email]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      dealershipIds: row.dealership_ids || [],
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      passwordHash: row.passwordHash
    };
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const result = await db.query(
      `SELECT u.id, u.email, u.name, u.role, 
              u.is_active as "isActive", u.created_at as "createdAt", u.updated_at as "updatedAt",
              array_agg(ud.dealership_id) as dealership_ids
       FROM users u
       LEFT JOIN user_dealerships ud ON u.id = ud.user_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      dealershipIds: row.dealership_ids || [],
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  /**
   * Find all users
   */
  async findAll(limit: number = 100, offset: number = 0): Promise<User[]> {
    const result = await db.query(
      `SELECT u.id, u.email, u.name, u.role, 
              u.is_active as "isActive", u.created_at as "createdAt", u.updated_at as "updatedAt",
              array_agg(ud.dealership_id) as dealership_ids
       FROM users u
       LEFT JOIN user_dealerships ud ON u.id = ud.user_id
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows.map(row => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      dealershipIds: row.dealership_ids || [],
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  }

  /**
   * Update user
   */
  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Update user fields
      const updateFields: string[] = [];
      const params: any[] = [id];
      let paramIndex = 2;

      if (updates.email) {
        updateFields.push(`email = $${paramIndex++}`);
        params.push(updates.email);
      }
      if (updates.name) {
        updateFields.push(`name = $${paramIndex++}`);
        params.push(updates.name);
      }
      if (updates.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        params.push(updates.isActive);
      }

      if (updateFields.length > 0) {
        updateFields.push(`updated_at = NOW()`);
        
        await client.query(
          `UPDATE users SET ${updateFields.join(', ')} WHERE id = $1`,
          params
        );
      }

      // Update dealership assignments if provided
      if (updates.dealershipIds) {
        // Delete existing assignments
        await client.query(
          'DELETE FROM user_dealerships WHERE user_id = $1',
          [id]
        );

        // Insert new assignments
        for (const dealershipId of updates.dealershipIds) {
          await client.query(
            `INSERT INTO user_dealerships (user_id, dealership_id)
             VALUES ($1, $2)`,
            [id, dealershipId]
          );
        }
      }

      await client.query('COMMIT');

      // Return updated user
      return this.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      log.error('Failed to update user:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    try {
      await db.query('DELETE FROM users WHERE id = $1', [id]);
    } catch (error) {
      log.error('Failed to delete user:', error);
      throw error;
    }
  }

  /**
   * Find users by dealership
   */
  async findByDealership(dealershipId: string): Promise<User[]> {
    const result = await db.query(
      `SELECT u.id, u.email, u.name, u.role, 
              u.is_active as "isActive", u.created_at as "createdAt", u.updated_at as "updatedAt",
              array_agg(ud.dealership_id) as dealership_ids
       FROM users u
       LEFT JOIN user_dealerships ud ON u.id = ud.user_id
       WHERE u.id IN (
         SELECT user_id FROM user_dealerships WHERE dealership_id = $1
       )
       GROUP BY u.id`,
      [dealershipId]
    );

    return result.rows.map(row => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      dealershipIds: row.dealership_ids || [],
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  }
}

export const userRepository = new UserRepository();
