import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface BusinessOption {
  id: number;
  name: string;
  isOwn: boolean;
  role?: string;
  permissions?: Record<string, boolean>;
  isImpersonated?: boolean;
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
  isAdminImpersonating: boolean;
  stopImpersonating: () => void;
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
  isAdminImpersonating: false,
  stopImpersonating: () => {},
});

const ACTIVE_BIZ_KEY = "county-active-business-id";
const ADMIN_IMPERSONATE_KEY = "county-admin-impersonate";

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: ownBiz, isLoading: bizLoading } = trpc.business.mine.useQuery();
  const { data: teamCtx, isLoading: teamLoading } = trpc.team.myContext.useQuery();
  const { data: adminBizList } = trpc.team.adminAllBusinesses.useQuery(undefined, {
    enabled: isAdmin,
    retry: false,
  });

  const [activeBusinessId, setActiveBusinessId] = useState<number | null>(() => {
    const saved = localStorage.getItem(ACTIVE_BIZ_KEY);
    return saved ? parseInt(saved, 10) : null;
  });

  // Track whether current session is admin impersonation
  const [impersonating, setImpersonating] = useState<boolean>(() => {
    return localStorage.getItem(ADMIN_IMPERSONATE_KEY) === "true";
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
    // Admin: add all businesses not already in list for impersonation
    if (isAdmin && adminBizList) {
      const existingIds = new Set(list.map(b => b.id));
      for (const ab of adminBizList) {
        if (!existingIds.has(ab.id)) {
          list.push({
            id: ab.id,
            name: ab.name,
            isOwn: false,
            role: "owner", // Admin gets full owner access
            isImpersonated: true,
          });
        }
      }
    }
    return list;
  }, [ownBiz, teamCtx, isAdmin, adminBizList]);

  useEffect(() => {
    if (bizLoading || teamLoading) return;
    if (businesses.length === 0) return;
    const currentValid = businesses.find(b => b.id === activeBusinessId);
    if (!currentValid) {
      const defaultBiz = businesses.find(b => b.isOwn) || businesses[0];
      setActiveBusinessId(defaultBiz.id);
      localStorage.setItem(ACTIVE_BIZ_KEY, String(defaultBiz.id));
      localStorage.removeItem(ADMIN_IMPERSONATE_KEY);
      setImpersonating(false);
    }
  }, [bizLoading, teamLoading, businesses, activeBusinessId]);

  const switchBusiness = useCallback((businessId: number) => {
    setActiveBusinessId(businessId);
    localStorage.setItem(ACTIVE_BIZ_KEY, String(businessId));

    // Check if this is an impersonated business (admin viewing client's biz)
    if (isAdmin) {
      const target = businesses.find(b => b.id === businessId);
      if (target?.isImpersonated) {
        localStorage.setItem(ADMIN_IMPERSONATE_KEY, "true");
        setImpersonating(true);
      } else {
        localStorage.removeItem(ADMIN_IMPERSONATE_KEY);
        setImpersonating(false);
      }
    }
    window.location.reload();
  }, [isAdmin, businesses]);

  const stopImpersonating = useCallback(() => {
    localStorage.removeItem(ADMIN_IMPERSONATE_KEY);
    setImpersonating(false);
    // Switch back to admin's own business
    const ownBusiness = businesses.find(b => b.isOwn);
    if (ownBusiness) {
      setActiveBusinessId(ownBusiness.id);
      localStorage.setItem(ACTIVE_BIZ_KEY, String(ownBusiness.id));
    }
    window.location.reload();
  }, [businesses]);

  const activeBiz = businesses.find(b => b.id === activeBusinessId);

  const isAdminImpersonating = isAdmin && impersonating && !!activeBiz?.isImpersonated;

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
    isAdminImpersonating,
    stopImpersonating,
  }), [activeBusinessId, activeBiz, businesses, switchBusiness, bizLoading, teamLoading, isAdminImpersonating, stopImpersonating]);

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
