import { MenuLateral } from "@/components/MenuLateral";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-wrap">
      <MenuLateral />
      <div className="flex min-w-0 flex-[999_1_560px] flex-col">{children}</div>
    </div>
  );
}
