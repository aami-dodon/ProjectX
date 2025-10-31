import * as React from "react"
import { toast } from "sonner"
import { z } from "zod"
import { IconCircleCheckFilled } from "@tabler/icons-react"

import { DataTableRowDrawer } from "@/shared/components/data-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { Separator } from "@/shared/components/ui/separator"
import { useCurrentUser } from "@/features/auth"

export const STATUS_LABELS = {
  ACTIVE: "Active",
  PENDING_VERIFICATION: "Pending verification",
  INVITED: "Invited",
  SUSPENDED: "Suspended",
}

const STATUS_TONE_STYLES = {
  info:
    "border-info/30 bg-info/15 text-info px-1.5 dark:border-info/20 dark:bg-info/20 dark:text-info",
  success:
    "border-success/30 bg-success/15 text-success px-1.5 dark:border-success/20 dark:bg-success/20 dark:text-success",
  warning:
    "border-warning/30 bg-warning/15 text-warning px-1.5 dark:border-warning/20 dark:bg-warning/20 dark:text-warning",
  danger:
    "border-danger/30 bg-danger/15 text-danger px-1.5 dark:border-danger/20 dark:bg-danger/20 dark:text-danger",
}

export const STATUS_BADGE_STYLES = {
  ACTIVE: STATUS_TONE_STYLES.success,
  PENDING_VERIFICATION: STATUS_TONE_STYLES.warning,
  INVITED: STATUS_TONE_STYLES.info,
  SUSPENDED: STATUS_TONE_STYLES.danger,
}

export const schema = z.object({
  id: z.union([z.string(), z.number()]),
  fullName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  avatarObjectName: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  roles: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]),
        name: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
  lastLoginAt: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  mfaEnabled: z.boolean().nullable().optional(),
  emailVerifiedAt: z.string().nullable().optional(),
})

export function formatDate(value) {
  if (!value) {
    return "—"
  }

  try {
    const date = new Date(value)
    return date.toLocaleString()
  } catch {
    return "—"
  }
}

function getInitials(value) {
  if (!value) {
    return "PX"
  }

  const trimmed = `${value}`.trim()
  if (!trimmed) {
    return "PX"
  }

  const parts = trimmed.split(/\s+/).filter(Boolean)

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

  return initials || "PX"
}

export function RoleBadge({ roles = [] }) {
  if (!roles.length) {
    return <span className="text-muted-foreground text-xs">—</span>
  }

  if (roles.length === 1) {
    return (
      <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
        {roles[0]?.name ?? "—"}
      </Badge>
    )
  }

  const [first, second, ...rest] = roles
  return (
    <div className="flex flex-wrap items-center gap-1">
      {[first, second]
        .filter(Boolean)
        .map((role) => (
          <Badge key={role.id} variant="outline" className="text-muted-foreground px-1.5 text-xs">
            {role.name}
          </Badge>
        ))}
      {rest.length ? (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          +{rest.length}
        </Badge>
      ) : null}
    </div>
  )
}

export const UserTableDrawer = React.memo(function UserTableDrawer({
  user,
  availableRoles,
  onUpdate,
  openUserId,
  activeDrawerTab,
  onDrawerOpenChange,
}) {
  const parsedUser = React.useMemo(() => schema.parse(user), [user])
  const currentUser = useCurrentUser()
  const isEditingSelf = React.useMemo(() => {
    if (!parsedUser?.id || !currentUser?.id) {
      return false
    }

    return `${parsedUser.id}` === `${currentUser.id}`
  }, [currentUser?.id, parsedUser?.id])
  const formId = React.useMemo(
    () => (parsedUser?.id ? `user-${parsedUser.id}-edit` : "user-edit"),
    [parsedUser?.id]
  )
  const [formState, setFormState] = React.useState({
    fullName: parsedUser.fullName ?? "",
    email: parsedUser.email ?? "",
    status: parsedUser.status ?? "ACTIVE",
    roleIds: (parsedUser.roles ?? []).map((role) => `${role.id}`),
  })
  const [isVerifying, setIsVerifying] = React.useState(false)

  React.useEffect(() => {
    setFormState({
      fullName: parsedUser.fullName ?? "",
      email: parsedUser.email ?? "",
      status: parsedUser.status ?? "ACTIVE",
      roleIds: (parsedUser.roles ?? []).map((role) => `${role.id}`),
    })
    setIsVerifying(false)
  }, [parsedUser.fullName, parsedUser.email, parsedUser.status, parsedUser.roles, parsedUser.id])

  const handleVerifyEmail = React.useCallback(
    (nextUser = parsedUser) => {
      if (!nextUser?.id || typeof onUpdate !== "function") {
        return
      }

      const label = nextUser.fullName || nextUser.email || "user"
      setIsVerifying(true)
      const result = Promise.resolve(onUpdate(nextUser.id, { verifyEmail: true }))

      toast.promise(result, {
        loading: `Verifying ${label}`,
        success: "Email marked as verified",
        error: "Unable to verify email",
      })

      result.finally(() => {
        setIsVerifying(false)
      })
    },
    [onUpdate, parsedUser]
  )

  const handleRoleToggle = React.useCallback(
    (roleId, checked) => {
      if (isEditingSelf) {
        return
      }

      setFormState((previous) => {
        const nextRoleIds = checked
          ? Array.from(new Set([...previous.roleIds, roleId]))
          : previous.roleIds.filter((value) => value !== roleId)

        return {
          ...previous,
          roleIds: nextRoleIds,
        }
      })
    },
    [isEditingSelf]
  )

  const handleSubmit = React.useCallback(
    (event) => {
      event.preventDefault()

      const payload = {
        fullName: formState.fullName,
        email: formState.email,
        status: formState.status,
        roleIds: formState.roleIds,
      }

      const label = parsedUser.fullName || parsedUser.email || "user"
      const result =
        typeof onUpdate === "function"
          ? Promise.resolve(onUpdate(parsedUser.id, payload))
          : new Promise((resolve) => setTimeout(resolve, 1000))

      toast.promise(result, {
        loading: `Saving ${label}`,
        success: "Changes saved",
        error: "Unable to save changes",
      })
    },
    [formState.fullName, formState.email, formState.status, formState.roleIds, onUpdate, parsedUser]
  )

  const normalizedRoles = React.useMemo(
    () => (availableRoles ?? []).map((role) => ({ ...role, id: `${role.id}` })),
    [availableRoles]
  )

  const normalizedUserId = React.useMemo(
    () => (parsedUser?.id == null ? null : `${parsedUser.id}`),
    [parsedUser?.id]
  )
  const isOpen = React.useMemo(() => {
    if (normalizedUserId === null || openUserId == null) {
      return false
    }

    return `${openUserId}` === normalizedUserId
  }, [normalizedUserId, openUserId])
  const defaultTab = isOpen ? activeDrawerTab : "view"
  const handleOpenChange = React.useCallback(
    (nextOpen) => {
      if (!normalizedUserId) {
        return
      }

      if (typeof onDrawerOpenChange !== "function") {
        return
      }

      onDrawerOpenChange(parsedUser.id, nextOpen)
    },
    [normalizedUserId, onDrawerOpenChange, parsedUser.id]
  )

  return (
    <DataTableRowDrawer
      item={parsedUser}
      trigger={
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          <span className="block font-medium leading-tight">
            {parsedUser.fullName || parsedUser.email || "—"}
          </span>
        </Button>
      }
      open={isOpen}
      onOpenChange={handleOpenChange}
      defaultTab={defaultTab}
      headerActions={({ item }) =>
        item?.email && !item.emailVerifiedAt
          ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleVerifyEmail(item)}
                disabled={isVerifying}>
                <IconCircleCheckFilled className="mr-2 size-4" />
                Verify email
              </Button>
            )
          : null
      }
      headerClassName="gap-4 border-b px-4 py-4 text-left"
      renderHeader={({ item: current, headerActions }) => {
        const displayName = current?.fullName || current?.email || "User"
        const initials = getInitials(current?.fullName || current?.email)
        const avatarSrc = current?.avatarUrl ?? current?.avatar ?? undefined

        return (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex flex-col items-center gap-2 sm:items-start">
                <Avatar className="border-border size-16 border">
                  <AvatarImage src={avatarSrc} alt={`${displayName} avatar`} />
                  <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <Badge
                  variant="outline"
                  className={
                    STATUS_BADGE_STYLES[current?.status] || "text-muted-foreground px-1.5"
                  }>
                  {STATUS_LABELS[current?.status] ?? current?.status ?? "—"}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="space-y-1">
                  <p className="text-base font-semibold leading-tight">{displayName}</p>
                  {current?.email ? (
                    <p className="text-muted-foreground text-sm">{current.email}</p>
                  ) : null}
                </div>
                {current?.emailVerifiedAt ? (
                  <div className="flex items-center gap-2 text-sm font-medium text-success">
                    <IconCircleCheckFilled className="text-success size-4" />
                    Verified
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm font-medium">Not verified</div>
                )}
              </div>
            </div>
            {headerActions ? (
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                {headerActions}
              </div>
            ) : null}
          </div>
        )
      }}
      direction="right"
      mobileDirection="bottom"
      renderView={({ item: current }) => {
        const mfaStatus =
          current?.mfaEnabled === true
            ? "Enabled"
            : current?.mfaEnabled === false
              ? "Disabled"
              : "—"
        const verificationMessage = current?.emailVerifiedAt
          ? `Verified on ${formatDate(current.emailVerifiedAt)}`
          : "Not verified"

        return (
          <div className="flex flex-col gap-6 text-sm">
            <div className="space-y-1">
              {current?.email ? (
                <p className="font-medium break-words">{current.email}</p>
              ) : null}
              <p className="text-muted-foreground text-sm">{verificationMessage}</p>
            </div>
            <dl className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Created</dt>
                <dd className="font-medium">{formatDate(current?.createdAt)}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last updated</dt>
                <dd className="font-medium">{formatDate(current?.updatedAt)}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last login</dt>
                <dd className="font-medium">{formatDate(current?.lastLoginAt)}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">MFA</dt>
                <dd className="font-medium">{mfaStatus}</dd>
              </div>
              <div className="space-y-1 md:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Roles</dt>
                <dd>
                  <RoleBadge roles={current?.roles ?? []} />
                </dd>
              </div>
            </dl>
          </div>
        )
      }}
      renderEdit={() => (
        <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-3 sm:col-span-2">
              <Label htmlFor={`${formId}-full-name`}>Full name</Label>
              <Input
                id={`${formId}-full-name`}
                value={formState.fullName}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    fullName: event.target.value,
                  }))
                }
                placeholder="Enter full name"
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor={`${formId}-email`}>Email</Label>
              <div className="flex flex-col gap-2">
                <Input
                  id={`${formId}-email`}
                  type="email"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((previous) => ({
                      ...previous,
                      email: event.target.value,
                    }))
                  }
                  placeholder="name@example.com"
                  autoComplete="off"
                />
                <p className="text-muted-foreground text-xs">
                  Updating the email resets verification until it is marked as verified.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor={`${formId}-status`}>Status</Label>
              <Select
                value={formState.status}
                onValueChange={(value) =>
                  setFormState((previous) => ({
                    ...previous,
                    status: value,
                  }))
                }>
                <SelectTrigger id={`${formId}-status`} className="w-full">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="flex flex-col gap-3">
            <Label>Roles</Label>
            <div className="space-y-2 rounded-md border p-3">
              {isEditingSelf ? (
                <p className="text-muted-foreground text-xs">
                  You cannot modify your own roles. Ask another admin to apply changes.
                </p>
              ) : null}
              {normalizedRoles.length ? (
                normalizedRoles.map((role) => {
                  const checked = formState.roleIds.includes(role.id)

                  return (
                    <label key={role.id} htmlFor={`${formId}-role-${role.id}`} className="flex items-start gap-2 text-sm">
                      <Checkbox
                        id={`${formId}-role-${role.id}`}
                        checked={checked}
                        onCheckedChange={(value) => handleRoleToggle(role.id, value === true)}
                        disabled={isEditingSelf}
                      />
                      <span className="flex flex-1 flex-col">
                        <span className="font-medium leading-none">{role.name}</span>
                        {role.description ? (
                          <span className="text-muted-foreground text-xs">{role.description}</span>
                        ) : null}
                      </span>
                    </label>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">No roles available for assignment.</p>
              )}
            </div>
          </div>
        </form>
      )}
      renderEditFooter={({ close }) => (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-xs text-muted-foreground">
            {isEditingSelf ? (
              <p>You cannot change your own status or roles.</p>
            ) : (
              <p>Updates apply immediately after saving.</p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => close()}>
              Cancel
            </Button>
            <Button type="submit" form={formId} disabled={isEditingSelf}>
              Save changes
            </Button>
          </div>
        </div>
      )}
    />
  )
})

export const TableCellViewer = React.memo(function TableCellViewer({ item, ...props }) {
  return <UserTableDrawer user={item} {...props} />
})
