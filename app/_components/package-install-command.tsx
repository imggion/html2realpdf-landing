"use client";

import { useId, useState } from "react";
import { CopyCommandButton } from "@/app/_components/copy-command-button";

const packageManagers = ["npm", "bun", "pnpm", "yarn"] as const;

type PackageManager = (typeof packageManagers)[number];

const installCommands: Record<PackageManager, (packageName: string) => string> = {
  npm: (packageName) => `npm install ${packageName}`,
  bun: (packageName) => `bun add ${packageName}`,
  pnpm: (packageName) => `pnpm add ${packageName}`,
  yarn: (packageName) => `yarn add ${packageName}`,
};

export function PackageInstallCommand({ packageName }: { packageName: string }) {
  const [packageManager, setPackageManager] = useState<PackageManager>("npm");
  const groupName = useId();
  const command = installCommands[packageManager](packageName);

  return (
    <div className="docsInstallCommand">
      <fieldset className="packageManagerPicker">
        <legend>Package manager</legend>
        <div className="packageManagerOptions">
          {packageManagers.map((manager) => (
            <label className="packageManagerOption" key={manager}>
              <input
                checked={packageManager === manager}
                name={groupName}
                onChange={() => setPackageManager(manager)}
                type="radio"
                value={manager}
              />
              <span>{manager}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="packageInstallCommandRow">
        <code aria-live="polite">{command}</code>
        <CopyCommandButton command={command} key={command} />
      </div>
    </div>
  );
}
