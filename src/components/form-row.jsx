import { Info } from "lucide-react";
import Tooltips from "./tooltips";

export const FormRow = ({ label, children, className, tooltips = "" }) => {
  return (
    <div
      className={`flex items-start max-md:flex-col gap-4 max-md:gap-2 max-lg:w-full`}
    >
      <label className="w-40 text-sm font-medium pt-2 flex items-center justify-between">
        {label}{" "}
        {tooltips != "" ?? (
          <Tooltips desc={tooltips} trigger={<Info className="size-4" />} />
        )}
      </label>
      <div className={`flex-1 ${className}`}>{children}</div>
    </div>
  );
};
