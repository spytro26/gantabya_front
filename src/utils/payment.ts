export const loadRazorpayScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window object not available"));
      return;
    }

    if ((window as any).Razorpay) {
      resolve();
      return;
    }

    const existingScript = document.getElementById("razorpay-checkout-js");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Razorpay script")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay script"));
    document.body.appendChild(script);
  });
};

interface EsewaFormParams {
  [key: string]: string | number | undefined | null;
}

export const submitEsewaForm = (formUrl: string, params: EsewaFormParams) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Document object not available");
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = formUrl;
  form.style.display = "none";

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};
