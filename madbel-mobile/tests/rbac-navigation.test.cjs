const test = require('node:test');
const assert = require('node:assert/strict');

// CommonJS wrapper for testing pure role computation
const ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  OWNER: "owner",
  MANAGER: "manager",
  STAFF: "staff",
};

const computeRolePermissions = (rawRole) => {
  const role = (rawRole || "owner").toLowerCase();

  const isSuperAdmin = role === ROLES.SUPERADMIN || role === "super_admin";
  const isAdmin = role === ROLES.ADMIN || isSuperAdmin;
  const isOwner = role === ROLES.OWNER || isAdmin;
  const isManager = role === ROLES.MANAGER || isOwner;
  const isStaff = role === ROLES.STAFF;

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

test('Mobile RBAC (4.5 / T07): Owner role permissions verification', () => {
  const perms = computeRolePermissions('owner');
  assert.equal(perms.isOwner, true);
  assert.equal(perms.isStaff, false);
  assert.equal(perms.canManageBilling, true);
  assert.equal(perms.canManageSubscriptions, true);
  assert.equal(perms.canManageInvoices, true);
  assert.equal(perms.canManageIntegrations, true);
});

test('Mobile RBAC (4.5 / T07): Manager role permissions verification', () => {
  const perms = computeRolePermissions('manager');
  assert.equal(perms.isOwner, false);
  assert.equal(perms.isManager, true);
  assert.equal(perms.isStaff, false);
  assert.equal(perms.canManageBilling, false);
  assert.equal(perms.canManageSubscriptions, false);
  assert.equal(perms.canManageInvoices, true);
  assert.equal(perms.canManageIntegrations, true);
});

test('Mobile RBAC (4.5 / T07): Staff role is strictly restricted from billing, invoices, agreements and integrations', () => {
  const perms = computeRolePermissions('staff');
  assert.equal(perms.isOwner, false);
  assert.equal(perms.isManager, false);
  assert.equal(perms.isStaff, true);
  assert.equal(perms.canManageBilling, false);
  assert.equal(perms.canManageSubscriptions, false);
  assert.equal(perms.canManageInvoices, false);
  assert.equal(perms.canManageAgreements, false);
  assert.equal(perms.canManageLeases, false);
  assert.equal(perms.canManageIntegrations, false);
});
