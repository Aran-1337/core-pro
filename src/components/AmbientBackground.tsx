export default function AmbientBackground() {
  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
      <div className="absolute top-[10%] right-[-5%] w-[40vw] h-[40vw] bg-primary/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[20%] left-[-10%] w-[30vw] h-[30vw] bg-secondary/5 rounded-full blur-[100px]"></div>
    </div>
  );
}
