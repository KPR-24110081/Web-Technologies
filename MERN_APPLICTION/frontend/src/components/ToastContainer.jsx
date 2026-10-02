import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import { toast } from "../services/toast";

const ICONS = {
  success: <CheckCircle2 />,
  error: <XCircle />,
  info: <Info />,
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe((item) => {
      setToasts((cur) => [...cur, item]);
      setTimeout(() => {
        setToasts((cur) => cur.filter((t) => t.id !== item.id));
      }, 3800);
    });
    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {ICONS[t.type] || ICONS.info}
          <div>{t.message}</div>
        </div>
      ))}
    </div>
  );
}