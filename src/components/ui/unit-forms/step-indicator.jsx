export default function StepIndicator({ steps, currentStep, onStepClick }) {
  return (
    <div className="flex items-center justify-center">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          {/* Step Circle — clickable */}
          <button
            type="button"
            onClick={() => onStepClick?.(step.number)}
            className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full text-sm md:text-lg cursor-pointer transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              currentStep === step.number
                ? "bg-primary text-white"
                : currentStep > step.number
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-500 hover:bg-gray-300"
            } font-bold text-lg`}
          >
            {step.number}
          </button>

          {/* Step Label — clickable */}
          <button
            type="button"
            onClick={() => onStepClick?.(step.number)}
            className="ml-2 mr-4 hidden md:block text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1 -mx-1"
          >
            <p
              className={`text-sm ${currentStep === step.number ? "font-medium" : "text-gray-500"}`}
            >
              <span>{step.label}</span>
            </p>
          </button>

          {/* Connector Line (except for last step) */}
          {index < steps.length - 1 && (
            <div className="flex-grow mx-2">
              <div
                className={`h-1 w-22 ${currentStep > step.number ? "bg-primary" : "bg-gray-200"}`}
              ></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
