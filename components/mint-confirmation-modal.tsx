import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { CheckCircleIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'

interface MintConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  transactionHash: string
  transactionLink: string
  walletAddress: string
}

export default function MintConfirmationModal({
  isOpen,
  onClose,
  transactionHash,
  transactionLink,
  walletAddress,
}: MintConfirmationModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircleIcon className="h-12 w-12 text-green-500" />
                </div>
                
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 text-center"
                >
                  NFT Successfully Minted!
                </Dialog.Title>

                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">
                    Your NFT has been minted and sent to:
                  </p>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded-md break-all">
                    {walletAddress}
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">
                    Transaction Hash:
                  </p>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded-md break-all">
                    {transactionHash}
                  </p>
                </div>

                <div className="mt-4 flex justify-center">
                  <a
                    href={transactionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    View on Block Explorer
                    <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4" />
                  </a>
                </div>

                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
} 