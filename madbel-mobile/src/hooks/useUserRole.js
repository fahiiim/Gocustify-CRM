import { useSelector } from "react-redux";

export const ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  OWNER: "owner",
  MANAGER: "manager",
  STAFF: "staff",
};

export const computeRolePermissions = (rawRole) => {
  const role = (rawRole || "owner").toLowerCase();

  const isSuperAdmin = role === ROLES.SUPERADMIN || role === "super_admin";
  const isAdmin = role === ROLES.ADMIN || isSuperAdmin;
  const isOwner = role === ROLES.OWNER || isAdmin;
  const isManager = role === ROLES.MANAGER || isOwner;
  const isStaff = role === ROLES.STAFF;

  // Granular capability flags
  const canManageBilling = isOwner;
  const canManageSubscriptions = isOwner;
  const canManageBusiness = isOwner || isManager;
  const canManageInvoices = isOwner || isManager;
  const canManageIntegrations = isOwner || isManager;
  const canManageAgreements = isOwner || isManager;
  const canManageLeases = isOwner || isManager;

  return {
    role,
    isSuperAdmin,
    isAdmin,
    isOwner,
    isManager,
    isStaff,
    canManageBilling,
    canManageSubscriptions,
    canManageBusiness,
    canManageInvoices,
    canManageIntegrations,
    canManageAgreements,
    canManageLeases,
  };
};

export const useUserRole = () => {
  const user = useSelector((state) => state?.auth?.user);
  return {
    user,
    ...computeRolePermissions(user?.role),
  };
};

export default useUserRole;
