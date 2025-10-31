"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ScanLine } from "lucide-react";
import { DEALERSHIPS } from "@lib/dealerships";
import { FormSchema, type FormData, type AppraiseResponse } from "@lib/types";
import { useVehicleListings } from "@/hooks/usedVehicleListings";
import { WholesalePricing } from "@/components/WholesalePricing";

type Props = {
  apiBase: string;
  onAppraised: (resp: AppraiseResponse) => void;
};

const makes = ["Acura","Audi","BMW","Cadillac","Chevrolet","Chrysler","Dodge","Ford","GMC","Honda","Hyundai","Jeep","Kia","Lexus","Mazda","Mercedes-Benz","Nissan","Ram","Subaru","Tesla","Toyota","Volkswagen","Volvo"];

const modelsByMake: Record<string, string[]> = {
  Acura: ["ILX","Integra","TLX","MDX","RDX","NSX"],
  Audi: ["A3","A4","A5","A6","A7","A8","Q3","Q5","Q7","Q8","e-tron","R8","TT"],
  BMW: ["2 Series","3 Series","4 Series","5 Series","7 Series","X1","X3","X5","X7","i4","iX"],
  Cadillac: ["CT4","CT5","Escalade","XT4","XT5","XT6","Lyriq"],
  Chevrolet: ["Blazer","Camaro","Colorado Crew Cab","Colorado Extended Cab","Corvette","Equinox","Malibu","Silverado 1500 Regular Cab","Silverado 1500 Extended Cab","Silverado 1500 Crew Cab","Silverado 2500 Regular Cab","Silverado 2500 Crew Cab","Silverado 3500 Regular Cab","Silverado 3500 Crew Cab","Suburban","Tahoe","Trailblazer","Traverse","Trax"],
  Chrysler: ["300","Pacifica"],
  Dodge: ["Challenger","Charger","Durango","Hornet"],
  Ford: ["Bronco","Bronco Sport","Edge","Escape","Expedition","Explorer","F-150 Regular Cab","F-150 SuperCab","F-150 SuperCrew","F-250 Regular Cab","F-250 SuperCab","F-250 Crew Cab","F-350 Regular Cab","F-350 SuperCab","F-350 Crew Cab","Maverick","Mustang","Ranger SuperCab","Ranger SuperCrew"],
  GMC: ["Acadia","Canyon Crew Cab","Canyon Extended Cab","Sierra 1500 Regular Cab","Sierra 1500 Double Cab","Sierra 1500 Crew Cab","Sierra 2500 Regular Cab","Sierra 2500 Crew Cab","Sierra 3500 Regular Cab","Sierra 3500 Crew Cab","Terrain","Yukon","Yukon XL"],
  Honda: ["Accord","Civic","CR-V","HR-V","Odyssey","Passport","Pilot","Ridgeline"],
  Hyundai: ["Elantra","Sonata","Tucson","Santa Fe","Palisade","Kona","Venue","Ioniq 5","Ioniq 6"],
  Jeep: ["Cherokee","Compass","Gladiator","Grand Cherokee","Grand Wagoneer","Renegade","Wagoneer","Wrangler 2-Door","Wrangler 4-Door","Wrangler Unlimited"],
  Kia: ["Forte","K5","Sportage","Sorento","Telluride","Seltos","Soul","EV6","Carnival"],
  Lexus: ["ES","IS","LS","GX","LX","NX","RX","UX","TX"],
  Mazda: ["Mazda3","Mazda6","CX-30","CX-5","CX-50","CX-9","CX-90","MX-5 Miata"],
  "Mercedes-Benz": ["A-Class","C-Class","E-Class","S-Class","GLA","GLB","GLC","GLE","GLS","EQB","EQE","EQS"],
  Nissan: ["Altima","Maxima","Sentra","Versa","Ariya","Kicks","Rogue","Murano","Pathfinder","Armada","Frontier Crew Cab","Frontier King Cab","Titan Crew Cab","Titan King Cab","Z"],
  Ram: ["1500 Regular Cab","1500 Quad Cab","1500 Crew Cab","2500 Regular Cab","2500 Crew Cab","3500 Regular Cab","3500 Crew Cab","ProMaster"],
  Subaru: ["Impreza","Legacy","Outback","Crosstrek","Forester","Ascent","WRX","BRZ","Solterra"],
  Tesla: ["Model 3","Model S","Model X","Model Y"],
  Toyota: ["Camry","Corolla","Avalon","Prius","RAV4","Highlander","4Runner","Sequoia","Tacoma Access Cab","Tacoma Double Cab","Tundra Regular Cab","Tundra Double Cab","Tundra CrewMax","Sienna","bZ4X","GR86","Supra"],
  Volkswagen: ["Jetta","Passat","Arteon","Taos","Tiguan","Atlas","ID.4","Golf GTI"],
  Volvo: ["S60","S90","V60","V90","XC40","XC60","XC90","C40"]
};

const optionsList = [
  "Navigation System","Sunroof/Moonroof","Leather Seats","Premium Sound System",
  "Third Row Seating","All-Wheel Drive","Adaptive Cruise Control","Heated Seats",
  "Backup Camera","Towing Package"
];

const conditionDescriptions: Record<number, string> = {
  1: "Poor - Significant damage, needs major repairs",
  2: "Fair - Visible wear, minor damage, functional",
  3: "Good - Normal wear, clean, well-maintained",
  4: "Very Good - Minimal wear, excellent condition",
  5: "Excellent - Like new, pristine condition"
};

export default function ValuationForm({ apiBase, onAppraised }: Props) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(FormSchema), defaultValues: { storeId: DEALERSHIPS[0]?.id ?? "", condition: 3, options: [] } });

  const make = watch("make");
  const condition = watch("condition");
  const vin = watch("vin");

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [decoding, setDecoding] = React.useState(false);
  const decodeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Initialize listings hook for wholesale pricing
  const { data: listingsData, loading: listingsLoading, error: listingsError, fetchListings } = 
    useVehicleListings(apiBase);

  // Helper: apply decoded fields, deferring "model" until after "make" is applied
  const applyDecoded = React.useCallback((decoded: any) => {
    if (decoded.year) setValue("year", decoded.year, { shouldDirty: true });
    if (decoded.make) setValue("make", decoded.make, { shouldDirty: true });
    if (decoded.trim) setValue("trim", decoded.trim, { shouldDirty: true });

    if (decoded.model) {
      // Defer to the next tick so the model <select> has options for the chosen make
      setTimeout(() => {
        setValue("model", decoded.model, { shouldDirty: true });
      }, 0);
    }
  }, [setValue]);

  const onSubmit = async (data: FormData) => {
    setErrorMsg(null);
    // Hardcode ZIP to 02122 (Boston, MA - Dorchester)
    const submissionData = {
      ...data,
      zip: "02122"
    };
    try {
      const res = await fetch(`${apiBase}/api/appraise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData)
      });
      if (!res.ok) {
        console.error("Appraise error", res.status, res.statusText);
        setErrorMsg("Appraisal failed. Please try again or contact support.");
        return;
      }
      const payload: AppraiseResponse = await res.json();
      onAppraised(payload);
    } catch (error) {
      console.error("Appraisal error:", error);
      setErrorMsg("An error occurred during appraisal. Please try again.");
    }
  };

  const onDecodeVin = React.useCallback(async () => {
    setErrorMsg(null);
    if (!vin || vin.length < 17) {
      return;
    }
    setDecoding(true);
    try {
      // Primary: orchestrator
      console.log("VIN decode: trying server", `${apiBase}/api/vin/decode`);
      const res = await fetch(`${apiBase}/api/vin/decode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin })
      });
      if (!res.ok) throw new Error(`server_decode_failed:${res.status}`);
      const decoded = await res.json();

      applyDecoded(decoded);

      // After successful decode, fetch market listings for wholesale pricing
      if (decoded.make && decoded.model && decoded.year) {
        const mileageValue = watch("mileage");
        await fetchListings(
          decoded.make,
          decoded.model,
          decoded.year,
          decoded.trim,
          mileageValue ? Number(mileageValue) : undefined
        );
      }
      return;
    } catch (e) {
      console.warn("VIN server decode failed, falling back to NHTSA", e);
      // Fallback: NHTSA VPIC
      try {
        const v = vin.trim().toUpperCase();
        const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(v)}?format=json`;
        console.log("VIN decode: calling NHTSA", url);
        const vp = await fetch(url, { mode: "cors" });
        if (!vp.ok) throw new Error(`nhtsa_http_${vp.status}`);
        const data = await vp.json();
        const row = data?.Results?.[0] || {};
        const decoded = {
          year: Number(row.ModelYear) || undefined,
          make: row.Make || undefined,
          model: row.Model || undefined,
          trim: row.Trim || row.Series || row.ModelVariantDescription || undefined,
        };

        applyDecoded(decoded);

        // After successful decode, fetch market listings for wholesale pricing
        if (decoded.make && decoded.model && decoded.year) {
          const mileageValue = watch("mileage");
          await fetchListings(
            decoded.make,
            decoded.model,
            decoded.year,
            decoded.trim,
            mileageValue ? Number(mileageValue) : undefined
          );
        }
        return;
      } catch (err) {
        console.error("VIN decode fallback failed", err);
      }
    } finally {
      setDecoding(false);
    }
  }, [vin, apiBase, watch, fetchListings, applyDecoded]);

  // Auto-decode when a full VIN (17 chars) is entered (debounced)
  React.useEffect(() => {
    if (decodeTimeoutRef.current) {
      clearTimeout(decodeTimeoutRef.current);
    }

    if (!vin || vin.length < 17) {
      return;
    }

    // Debounce: wait 600ms after user stops typing before decoding
    decodeTimeoutRef.current = setTimeout(() => {
      onDecodeVin();
    }, 600);

    return () => {
      if (decodeTimeoutRef.current) {
        clearTimeout(decodeTimeoutRef.current);
      }
    };
  }, [vin, onDecodeVin]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            Demo uses simulated valuations. Real integrations with licensed providers (Black Book, KBB, NADA, Manheim) are available.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMsg}
        </div>
      )}

      {/* Dealership */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Dealership *</label>
        <select {...register("storeId")} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500">
          <option value="">Select a dealership</option>
          {DEALERSHIPS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {errors.storeId && <p className="text-sm text-red-600 mt-1">{errors.storeId.message as string}</p>}
      </div>

      {/* VIN + Decode */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">VIN (optional) - Auto-fill vehicle details</label>
        <div className="flex gap-2">
          <input
            {...register("vin")}
            placeholder="e.g., 1G1ZT62812F113456"
            className="flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase"
          />
          <button
            type="button"
            onClick={onDecodeVin}
            disabled={decoding || !vin || vin.length < 17}
            className={`px-4 py-2.5 rounded-lg font-semibold text-white transition ${
              decoding || !vin || vin.length < 17
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-teal-500 hover:bg-teal-600"
            }`}
          >
            {decoding ? (
              <span className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Decode
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <ScanLine className="w-4 h-4" />
                Decode
              </span>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {vin && vin.length >= 17
            ? "Ready to decode."
            : "Enter the full 17-character VIN to auto-decode (or tap Decode)."}
        </p>
      </div>

      {/* Vehicle fields */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Year *</label>
          <select {...register("year")} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="">Select Year</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {errors.year && <p className="text-sm text-red-600 mt-1">{errors.year.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Make *</label>
          <select {...register("make")} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="">Select Make</option>
            {makes.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          {errors.make && <p className="text-sm text-red-600 mt-1">{errors.make.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Model *</label>
          <select
            {...register("model")}
            disabled={!watch("make")}
            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
          >
            <option value="">{watch("make") ? "Select Model" : "Select Make First"}</option>
            {(watch("make") ? (modelsByMake[watch("make")!] || []) : []).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          {errors.model && <p className="text-sm text-red-600 mt-1">{errors.model.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Trim</label>
          <input {...register("trim")} placeholder="e.g., LE, Sport, Limited"
            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Mileage *</label>
          <input type="number" {...register("mileage")} placeholder="Enter mileage"
            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
          {errors.mileage && <p className="text-sm text-red-600 mt-1">{errors.mileage.message as string}</p>}
        </div>
      </div>

      {/* Condition */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Vehicle Condition: {condition}
        </label>
        <input type="range" min={1} max={5} {...register("condition")}
          className="w-full h-2 bg-gray-200 rounded-lg accent-indigo-600" />
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          <span>Poor</span><span>Fair</span><span>Good</span><span>Very Good</span><span>Excellent</span>
        </div>
        <p className="text-sm text-gray-600 mt-2 italic">
          {conditionDescriptions[Number(condition) || 3]}
        </p>
      </div>

      {/* Options */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Additional Options</label>
        <div className="grid grid-cols-2 gap-3">
          {optionsList.map(o => (
            <label key={o} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" value={o} {...register("options")}
                     className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" />
              <span className="text-sm text-gray-700">{o}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Market Valuation Section */}
      {(listingsData || listingsLoading || listingsError) && (
        <div className="mb-8 mt-8 border-t pt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Market Valuation
          </h3>
          <WholesalePricing
            pricing={listingsData?.pricing}
            listings={listingsData?.listings}
            loading={listingsLoading}
            error={listingsError}
            vehicleTitle={`${watch("year")} ${watch("make")} ${watch("model")}`}
          />
        </div>
      )}

      <button type="submit" disabled={isSubmitting}
        className={`w-full py-4 rounded-lg font-semibold text-white ${isSubmitting ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"}`}>
        {isSubmitting ? "Calculating..." : "Get Wholesale Value"}
      </button>
    </form>
  );
}
