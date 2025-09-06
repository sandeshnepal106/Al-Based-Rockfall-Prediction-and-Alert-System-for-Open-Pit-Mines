import React from 'react'
import { Image } from "lucide-react";

const imagepreview = ({ preview }) => {
    return (
        <div className="flex-1 bg-slate-800/40 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2 text-blue-300">
                <Image className="h-6 w-6 text-blue-400" />
                Selected Image
            </h3>
            <div className="flex items-center justify-center">
                <img
                    src={preview}
                    alt="Preview"
                    className="max-h-[400px] w-full object-contain rounded-2xl shadow-lg border border-slate-700"
                />
            </div>
        </div>
    )
}

export default imagepreview
