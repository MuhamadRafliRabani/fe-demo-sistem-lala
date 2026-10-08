export const WrapperTable = ({ children, title, desc, action }) => {
  return (
    <div className="w-full h-full flex flex-col rounded-xl border shadow-sm overflow-hidden">
      {/* Header Section */}
      <div className="flex flex-row items-center justify-between gap-4 p-5 border-b">
        <div className="space-y-1">
          {title && (
            <h3 className="text-[15.9px] xl:text-md font-semibold text-accent leading-none tracking-tight 2xl:text-2xl">
              {title}
            </h3>
          )}
          {desc && (
            <p className="text-sm 2xl:text-xl text-slate-500 dark:text-slate-400">
              {desc}
            </p>
          )}
        </div>

        {/* Optional Action Area (Misalnya tombol Filter atau Export) */}
        {action && <div className="flex items-center">{action}</div>}
      </div>

      {/* Table Content Section */}
      {/* Wrapper ini memastikan padding/margin anak tidak merusak layout */}
      <div className="relative flex-1 min-h-0 w-full">{children}</div>
    </div>
  );
};
