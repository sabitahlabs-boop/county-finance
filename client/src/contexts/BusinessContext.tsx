import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface BusinessOption {
  id: number;
  name: string;
  isOwn: boolean;
  role?: string;
  permissions?: Record<string, boolean>;
}

interface BusinessContextType {
  activeBusinessId: number | null;
  activeBusinessName: string;
  isOwnBusiness: boolean;
  activeRole: string | null;
  activePermissions: Record<string, boolean> | null;
  businesses: BusinessOption[];
  switchBusiness: (businessId: number) => void;
  isLoading: boolean;
  hasMultipleBusinesses: boolean;
}

const BusinessContext = createContext<BusinessContextType>({
  activeBusinessId: null,
  activeBusinessName: "",
  isOwnBusiness: true,
  activeRole: null,
  activePermissions: null,
  businesses: [],
  switchBusiness: () => {},
  isLoading: true,
  hasMultipleBusinesses: false,
});

const ACTIVE_BIZ_KEY = "county-active-business-id";

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { data: ownBiz, isLoading: bizLoading } = trpc.business.mine.useQuery();
  const { data: teamCtx, isLoading: teamLoading } = trpc.team.myContext.useQuery();

  const [activeBusinessId, setActiveBusinessId] = useState<number | null>(() => {
    const saved = localStorage.getItem(ACTIVE_BIZ_KEY);
    return saved ? parseInt(saved, 10) : null;
  });

  const businesses = useMemo(() => {
    const list: BusinessOption[] = [];
    if (ownBiz) {
      list.push({ id: ownBiz.id, name: ownBiz.businessName, isOwn: true, role: "owner" });
    }
    if (teamCtx?.memberships) {
      for (const m of teamCtx.memberships) {
        if (ownBiz && m.businessId === ownBiz.id) continue;
        list.push({
          id: m.businessId,
          name: m.businessName,
          isOwn: false,
          role: m.role,
          permissions: m.permissions as Record<string, boolean>,
        });
      }
    }
    return list;
  }, [ownBiz, teamCtx]);

  useEffect(() => {
    if (bizLoading || teamLoading) return;
    if (businesses.length === 0) return;
    const currentValid = businesses.find(b => b.id === activeBusinessId);
    if (!currentValid) {
      const defaultBiz = businesses.find(b => b.isOwn) || businesses[0];
      setActiveBusinessId(defaultBiz.id);
      localStorage.setItem(ACTIVE_BIZ_KEY, String(defaultBiz.id));
    }
  }, [bizLoading, teamLoading, businesses, activeBusinessId]);

  const switchBusiness = useCallback((businessId: number) => {
    setActiveBusinessId(businessId);
    localStorage.setItem(ACTIVE_BIZ_KEY, String(businessId));
    window.location.reload();
  }, []);

  const activeBiz = businesses.find(b => b.id === activeBusinessId);

  const value = useMemo(() => ({
    activeBusinessId,
    activeBusinessName: activeBiz?.name ?? "",
    isOwnBusiness: activeBiz?.isOwn ?? true,
    activeRole: activeBiz?.role ?? null,
    activePermissions: activeBiz?.permissions ?? null,
    businesses,
    switchBusiness,
    isLoading: bizLoading || teamLoading,
    hasMultipleBusinesses: businesses.length > 1,
  }), [activeBusinessId, activeBiz, businesses, switchBusiness, bizLoading, teamLoading]);

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessContext() {
  return useContext(BusinessContext);
}

export function getActiveBusinessId(): number | null {
  const saved = localStorage.getItem(ACTIVE_BIZ_KEY);
  return saved ? parseInt(saved, 10) : null;
}
