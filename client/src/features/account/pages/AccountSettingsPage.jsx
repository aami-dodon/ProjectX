import { AccountSettingsForm } from "../components/AccountSettingsForm";
import { PasswordChangeForm } from "../components/PasswordChangeForm";

export function AccountSettingsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <AccountSettingsForm className="self-start" />
            <PasswordChangeForm className="self-start lg:max-w-md xl:max-w-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
