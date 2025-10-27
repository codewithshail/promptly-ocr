import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  gradientFrom: string;
  gradientTo: string;
  bgGradientFrom: string;
  bgGradientTo: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  features,
  gradientFrom,
  gradientTo,
  bgGradientFrom,
  bgGradientTo,
}: FeatureCardProps) {
  return (
    <div
      className={`group relative p-8 rounded-2xl bg-gradient-to-br ${bgGradientFrom} ${bgGradientTo} hover:shadow-2xl transition-all duration-300 hover:-translate-y-2`}
    >
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-10 transition-opacity`}
      />
      <div className="relative">
        <div
          className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} mb-6 group-hover:scale-110 transition-transform`}
        >
          <Icon className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed mb-4">{description}</p>
        <ul className="space-y-2 text-sm text-gray-600">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <div
                className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${gradientFrom} mt-1.5`}
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
