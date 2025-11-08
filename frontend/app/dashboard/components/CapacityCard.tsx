"use client"

import { useState } from "react"

export default function CapacityCard() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl shadow-md p-6 border border-primary/20">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Capacity Building</h2>
            <p className="text-text-secondary mb-4">
              Train PHC staff to act on insights and optimize resource allocation
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors font-medium text-sm"
            >
              View Training Modules
            </button>
          </div>
          <span className="text-4xl">📚</span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-text-primary mb-4">Training Modules (Future)</h3>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-3">
                <span className="text-primary">✓</span>
                <span className="text-text-secondary">Data-driven decision making</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">✓</span>
                <span className="text-text-secondary">Outbreak response protocols</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">✓</span>
                <span className="text-text-secondary">Resource optimization</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">✓</span>
                <span className="text-text-secondary">Community engagement</span>
              </li>
            </ul>
            <button
              onClick={() => setShowModal(false)}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
