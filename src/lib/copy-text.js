import { toast } from "sonner";

export const copyText = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;

      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";

      document.body.appendChild(textArea);

      textArea.focus();
      textArea.select();

      document.execCommand("copy");

      textArea.remove();
    }

    toast.success("Alamat disalin");
  } catch (err) {
    console.error(err);
    toast.error("Gagal menyalin");
  }
};
