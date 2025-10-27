const steps = [
  {
    number: 1,
    title: "Sign Up Free",
    description:
      "Create your account in seconds with email or social login. No credit card required.",
    gradientFrom: "from-blue-600",
    gradientTo: "to-indigo-600",
  },
  {
    number: 2,
    title: "Choose Your Tool",
    description:
      "Access chatbot, copy checking, current affairs, or tips based on your immediate needs.",
    gradientFrom: "from-indigo-600",
    gradientTo: "to-purple-600",
  },
  {
    number: 3,
    title: "Start Learning",
    description:
      "Get instant AI-powered insights, evaluations, and personalized content to ace your exam.",
    gradientFrom: "from-purple-600",
    gradientTo: "to-pink-600",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get started in minutes and transform your UPSC preparation journey
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div
                    className={`w-20 h-20 rounded-full bg-gradient-to-br ${step.gradientFrom} ${step.gradientTo} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}
                  >
                    {step.number}
                  </div>
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`hidden md:block absolute top-10 left-20 w-full h-0.5 bg-gradient-to-r ${step.gradientFrom} ${step.gradientTo} opacity-30`}
                    />
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
