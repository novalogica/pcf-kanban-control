import { ToastOptions } from "react-hot-toast"

/** Anzahl Karten, die pro Spalte initial angezeigt werden; beim Runterscrollen wird nachgeladen. */
export const INITIAL_CARDS_VISIBLE = 30;
/** Beim Erreichen des unteren Bereichs werden so viele weitere Karten angezeigt. */
export const LOAD_MORE_CARDS_COUNT = 30;
/** Abstand zum unteren Scrollrand (px), ab dem nachgeladen wird. */
export const SCROLL_LOAD_THRESHOLD_PX = 150;

export const unlocatedColumn = {
  key: "unallocated",
  id: "unallocated", 
  label: "Unallocated",
  title: "Unallocated", 
  order: 0
}

export const toastOptions: ToastOptions = {
  style: {
      borderRadius: 2,
      padding: 16
  },
  duration: 5000
}