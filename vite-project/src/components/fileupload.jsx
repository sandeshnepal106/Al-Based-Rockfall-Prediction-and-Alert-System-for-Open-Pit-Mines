import React from 'react'
import { Upload } from "lucide-react";

const fileupload = ({ onFileChange, fileUploaded }) => {
    return (
        <div>
            <section className="bg-slate-800/40 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-700 hover:border-blue-400 transition-all transform hover:scale-105 hover:shadow-blue-500/20">
                <label className="flex flex-col items-center gap-4 cursor-pointer">
                    <Upload className="h-12 w-12 text-blue-400 drop-shadow" />
                    <span className="text-xl font-semibold text-white">
                        {fileUploaded ? "✓ Image Uploaded" : "Choose an Image"}
                    </span>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={onFileChange}
                        className="hidden"
                    />
                    <p className="text-sm text-gray-400">Supported: JPG, PNG</p>
                </label>
            </section>
        </div>
    )
}

export default fileupload
