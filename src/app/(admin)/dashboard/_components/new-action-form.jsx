"use client";

import { useActionState, useEffect, useState } from "react";
import { addNewAction } from "../_actions/actions";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

const initialState = {
  success: false,
  message: "",
};

const ACTIONS = [
  { label: "Office visit", value: "Office visit" },
  { label: "Make a call", value: "Make a call" },
  { label: "Property view", value: "Property view" },
  { label: "Not interested", value: "Not interested" },
  { label: "Not qualified", value: "Not qualified" },
  { label: "Follow up later", value: "Follow up later" },
  { label: "Missing Requirement", value: "Missing requirement" },
];

export default function NewActionForm({ userId, onSuccess }) {
  const [state, action, pending] = useActionState(addNewAction, initialState);
  const cliedId = Cookies.get("client_id")
  console.log(cliedId) 
  const [formData, setFormData] = useState({
    action: ACTIONS[0].value,
    comment: "",
    meeting_time: "",
    created_at: new Date().toISOString(),
    client_id: cliedId
  });
  console.log(addNewAction)

  useEffect(() => {
    if (state.success) {
      toast.success(state.message, {
        duration: 3000,
        position: "top-right",
      });
      setFormData({ 
        action: ACTIONS[0].value, 
        comment: "",
        meeting_time: "",
        created_at: new Date().toISOString(),
        client_id: cliedId
      });
      onSuccess();
    } else if (state.message) {
     
      toast.error(state.message, {
        // duration: 3000,
        position: "top-right",
      });
    }
  }, [state, userId]); 
   

  return (
    <form className="p-3" action={action}>
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="phone_number" value={""} />
      <input type="hidden" name="client_id" value={cliedId} />
      <input type="hidden" name="created_at" value={formData.created_at} />

      <div className="flex items-end gap-2 mb-2">
        <select
          name="action"
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 hover:bg-gray-100 text-sm"
          value={formData.action}
          onChange={(e) =>
            setFormData({ ...formData, action: e.target.value })
          }
          required
        >
          {ACTIONS.map((action) => (
            <option key={action.value} value={action.value}>
              {action.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          name="meeting_time"
          value={formData.meeting_time}
          onChange={(e) =>
            setFormData({ ...formData, meeting_time: e.target.value })
          }
          className="w-full border border-gray-300 rounded-md p-2 text-sm"
        />
      </div>

      <textarea
        name="comment"
        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full text-gray-700 hover:bg-gray-100 text-sm"
        placeholder="Enter your comment here..."
        rows="3"
        value={formData.comment}
        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
      />

      <button
        disabled={pending}
        className="w-full flex justify-center items-center bg-blue-500 text-white px-4 py-1.5 rounded-lg hover:bg-blue-600 cursor-pointer disabled:opacity-60 disabled:cursor-auto disabled:hover:bg-blue-500"
      >
        {pending ? <Loader2 className="animate-spin" /> : "Send"}
      </button>
    </form>
  );
}
