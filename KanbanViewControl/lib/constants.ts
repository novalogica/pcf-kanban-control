import { ToastOptions } from "react-hot-toast"

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