import { HeaderView } from "@/components/layout/Header";
import styles from "./status.module.css";

export default function Loading() {
  return (
    <div className="container" aria-busy="true">
      <HeaderView count={0} />
      <div className={styles.loading} role="status">
        載入中...
      </div>
    </div>
  );
}
