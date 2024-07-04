import { redirect } from 'next/navigation';

interface ContainerProps {
  children: React.ReactNode;
  customStyle?: string;
}

export default function BorderedContainer(props: ContainerProps) {
  return (
    <div
      className={`min-w-[200px] rounded-md border border-zinc-800 ${props.customStyle}`}
    >
      {props.children}
    </div>
  );
}
