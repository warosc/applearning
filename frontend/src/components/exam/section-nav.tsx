'use client';
interface Section {
  id: string;
  title: string;
  instructions?: string;
  questionCount: number; // actual questions in this section
}
interface Props {
  sections: Section[];
  currentSectionIndex: number;
  answeredPerSection: Record<string, number>;
  onSectionClick: (index: number) => void;
}
export function SectionNav({ sections, currentSectionIndex, answeredPerSection, onSectionClick }: Props) {
  // Renders horizontal tabs showing each section name, answered/total count
  // Current section highlighted with blue border
  // Clicking a section tab navigates to it
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-white px-4">
      {sections.map((sec, idx) => {
        const answered = answeredPerSection[sec.id] ?? 0;
        const isActive = idx === currentSectionIndex;
        return (
          <button
            key={sec.id}
            onClick={() => onSectionClick(idx)}
            className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              isActive ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {sec.title}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              {answered}/{sec.questionCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}
