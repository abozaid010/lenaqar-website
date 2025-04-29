export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-center">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          {/* Step Circle */}
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full ${
              currentStep === step.number
                ? "bg-primary text-white"
                : currentStep > step.number
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-500"
            } font-bold text-lg`}
          >
            {step.number}
          </div>

          {/* Step Label */}
          <div className="ml-2 mr-4">
            <p
              className={`text-sm ${currentStep === step.number ? "font-medium" : "text-gray-500"}`}
            >
              {step.label}
            </p>
          </div>

          {/* Connector Line (except for last step) */}
          {index < steps.length - 1 && (
            <div className="flex-grow mx-2">
              <div
                className={`h-1 w-24 ${currentStep > step.number ? "bg-primary" : "bg-gray-200"}`}
              ></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
