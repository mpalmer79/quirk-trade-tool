/**
 * QUICK INTEGRATION EXAMPLES
 * Copy-paste these examples to add permissions to your existing components
 */

// ============================================================================
// EXAMPLE 1: Protect an entire page
// ============================================================================
"use client";

import { useRequireAuth } from "@/app/lib/auth-context";
import { PermissionGuard } from "@/components/PermissionGuard";
import { Permission } from "@/app/lib/auth-types";

export default function AppraisalPage() {
  // Redirect to login if not authenticated
  const { user, isLoading } = useRequireAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    // Require specific permission to view page
    <PermissionGuard 
      permission={Permission.VIEW_APPRAISAL_HISTORY}
      fallback={<div>Access Denied</div>}
    >
      <div>Your page content here</div>
    </PermissionGuard>
  );
}

// ============================================================================
// EXAMPLE 2: Filter dealership dropdown by user access
// ============================================================================
import { useAuth } from "@/app/lib/auth-context";
import { getAccessibleDealerships } from "@/app/lib/permissions";
import { DEALERSHIPS } from "@/app/dealerships";

function DealershipSelector() {
  const { user } = useAuth();
  
  const accessibleDealerships = DEALERSHIPS.filter(d => 
    getAccessibleDealerships(user, DEALERSHIPS.map(d => d.id)).includes(d.id)
  );

  return (
    <select>
      <option value="">Select Dealership</option>
      {accessibleDealerships.map(d => (
        <option key={d.id} value={d.id}>{d.name}</option>
      ))}
    </select>
  );
}

// ============================================================================
// EXAMPLE 3: Show/hide buttons based on permissions
// ============================================================================
import { usePermission } from "@/components/PermissionGuard";
import { Permission } from "@/app/lib/auth-types";

function AppraisalActions({ appraisalId }) {
  const canEdit = usePermission(Permission.EDIT_APPRAISAL);
  const canDelete = usePermission(Permission.DELETE_APPRAISAL);

  return (
    <div className="flex gap-2">
      {canEdit && (
        <button onClick={() => handleEdit(appraisalId)}>
          Edit
        </button>
      )}
      {canDelete && (
        <button onClick={() => handleDelete(appraisalId)}>
          Delete
        </button>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Show different UI based on role
// ============================================================================
import { useAuth } from "@/app/lib/auth-context";
import { UserRole } from "@/app/lib/auth-types";
import { RoleGuard } from "@/components/PermissionGuard";

function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Show admin panel only to admins */}
      <RoleGuard allowedRoles={[UserRole.ADMIN]}>
        <AdminPanel />
      </RoleGuard>

      {/* Show manager tools to managers */}
      <RoleGuard allowedRoles={[UserRole.GENERAL_MANAGER, UserRole.GENERAL_SALES_MANAGER]}>
        <ManagerTools />
      </RoleGuard>

      {/* Content visible to all */}
      <MainContent />
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Check dealership access before showing data
// ============================================================================
import { useDealershipAccess } from "@/components/PermissionGuard";
import { DealershipGuard } from "@/components/PermissionGuard";

function DealershipReport({ dealershipId }) {
  const hasAccess = useDealershipAccess(dealershipId);

  // Option 1: Using hook
  if (!hasAccess) {
    return <div>You don't have access to this dealership</div>;
  }

  // Option 2: Using component
  return (
    <DealershipGuard 
      dealershipId={dealershipId}
      fallback={<div>No access</div>}
    >
      <div>Dealership data here</div>
    </DealershipGuard>
  );
}

// ============================================================================
// EXAMPLE 6: Filter API data by accessible dealerships
// ============================================================================
import { useAuth } from "@/app/lib/auth-context";
import { canAccessDealership } from "@/app/lib/permissions";

function AppraisalList() {
  const { user } = useAuth();
  const [appraisals, setAppraisals] = useState([]);

  useEffect(() => {
    async function loadAppraisals() {
      const response = await fetch("/api/appraisals");
      const data = await response.json();
      
      // Filter to only show appraisals from accessible dealerships
      const filtered = data.filter(appraisal => 
        canAccessDealership(user, appraisal.dealershipId)
      );
      
      setAppraisals(filtered);
    }
    
    loadAppraisals();
  }, [user]);

  return (
    <div>
      {appraisals.map(a => <AppraisalCard key={a.id} appraisal={a} />)}
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: Conditionally enable form fields
// ============================================================================
import { useAuth } from "@/app/lib/auth-context";
import { UserRole } from "@/app/lib/auth-types";

function AppraisalForm() {
  const { user } = useAuth();
  
  // Only admins and general managers can edit certain fields
  const canEditSpecialFields = user && [
    UserRole.ADMIN, 
    UserRole.GENERAL_MANAGER
  ].includes(user.role);

  return (
    <form>
      <input name="vin" />
      <input name="year" />
      <input name="make" />
      
      {/* Only show to specific roles */}
      {canEditSpecialFields && (
        <input name="specialDiscount" />
      )}
    </form>
  );
}

// ============================================================================
// EXAMPLE 8: Show user info in navigation
// ============================================================================
import { useAuth } from "@/app/lib/auth-context";
import { getRoleDisplayName } from "@/app/lib/auth-types";

function NavigationBar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav>
      <div>
        <span>{user.name}</span>
        <span className="text-sm text-gray-500">
          {getRoleDisplayName(user.role)}
        </span>
      </div>
      <button onClick={logout}>Logout</button>
    </nav>
  );
}

// ============================================================================
// EXAMPLE 9: Validate before submitting form
// ============================================================================
import { useAuth } from "@/app/lib/auth-context";
import { canAccessDealership } from "@/app/lib/permissions";

function TradeForm() {
  const { user } = useAuth();

  const handleSubmit = (data) => {
    // Verify user has access to the selected dealership
    if (!canAccessDealership(user, data.dealershipId)) {
      alert("You don't have access to this dealership");
      return;
    }

    // Proceed with submission
    submitAppraisal(data);
  };

  return <form onSubmit={handleSubmit}>...</form>;
}

// ============================================================================
// EXAMPLE 10: Load different data based on role
// ============================================================================
import { useAuth } from "@/app/lib/auth-context";
import { UserRole } from "@/app/lib/auth-types";

function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);

  useEffect(() => {
    async function loadReports() {
      let endpoint = "/api/reports";
      
      // Admins get all reports
      if (user.role === UserRole.ADMIN) {
        endpoint = "/api/reports/all";
      }
      // Managers get their dealerships' reports
      else if (user.dealershipIds?.length) {
        endpoint = `/api/reports?dealerships=${user.dealershipIds.join(",")}`;
      }

      const response = await fetch(endpoint);
      const data = await response.json();
      setReports(data);
    }

    loadReports();
  }, [user]);

  return <div>{/* Render reports */}</div>;
}

// ============================================================================
// EXAMPLE 11: Multiple permission checks
// ============================================================================
import { PermissionGuard } from "@/components/PermissionGuard";
import { Permission } from "@/app/lib/auth-types";

function AdminSection() {
  return (
    // Require ALL of these permissions
    <PermissionGuard 
      permissions={[
        Permission.MANAGE_USERS,
        Permission.VIEW_SYSTEM_SETTINGS
      ]}
      requireAll={true}
    >
      <AdminPanel />
    </PermissionGuard>
  );
}

function ManagerSection() {
  return (
    // Require ANY of these permissions
    <PermissionGuard 
      permissions={[
        Permission.ADD_SALES_MANAGERS,
        Permission.VIEW_DEALERSHIP_REPORTS
      ]}
      requireAll={false}
    >
      <ManagerPanel />
    </PermissionGuard>
  );
}

// ============================================================================
// EXAMPLE 12: Check permissions in utility functions
// ============================================================================
import { hasPermission } from "@/app/lib/permissions";
import { Permission } from "@/app/lib/auth-types";

function canUserEditAppraisal(user, appraisal) {
  // Must have edit permission
  if (!hasPermission(user, Permission.EDIT_APPRAISAL)) {
    return false;
  }

  // Must have access to the dealership
  if (!canAccessDealership(user, appraisal.dealershipId)) {
    return false;
  }

  return true;
}
