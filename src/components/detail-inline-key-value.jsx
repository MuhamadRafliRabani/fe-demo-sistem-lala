const InlineKeyValue = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-start py-2.5 sm:py-2 border-b border-white/5 sm:border-transparent last:border-0">
    <span className="text-[13px] text-slate-400 font-medium w-full sm:w-[130px] md:w-[140px] shrink-0 mb-1 sm:mb-0">
      {label}
    </span>
    <span className="hidden sm:inline-block text-slate-500 px-2 font-medium select-none">
      :
    </span>
    <span className="text-[13px] text-slate-100 font-semibold break-words flex-1 leading-snug">
      {value || (
        <span className="text-slate-600 font-normal italic">Empty</span>
      )}
    </span>
  </div>
);
export default InlineKeyValue;
