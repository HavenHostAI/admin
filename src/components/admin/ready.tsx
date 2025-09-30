import {
  ScanFace,
  BookOpenText,
  ChevronsLeftRight,
  Github,
} from "lucide-react";

export const Ready = () => (
  <div className="flex h-screen flex-col">
    <div
      className="flex flex-1 flex-col items-center justify-center text-center text-white"
      style={{
        background:
          "linear-gradient(135deg, #00023b 0%, #00023b 50%, #313264 100%)",
      }}
    >
      <ScanFace className="mb-4 h-32 w-32" />
      <h1 className="mb-4 text-3xl">Welcome to shadcn-admin-kit</h1>
      <div className="text-lg opacity-75">
        Your application is properly configured.
        <br />
        Now you can add a &lt;Resource&gt; as child of
        &lt;Admin&gt;&lt;/Admin&gt;
      </div>
    </div>
    <div className="flex h-[20vh] items-center justify-evenly bg-zinc-100 text-black">
      <div className="text-xl">
        <a href="https://marmelab.com/shadcn-admin-kit/docs">
          <BookOpenText className="mr-4 inline h-10 w-10" />
          Documentation
        </a>
      </div>
      <div className="text-xl">
        <a href="http://marmelab.com/shadcn-admin-kit/demo">
          <ChevronsLeftRight className="mr-4 inline h-10 w-10" />
          Demo
        </a>
      </div>
      <div className="text-xl">
        <a href="https://github.com/marmelab/shadcn-admin-kit">
          <Github className="mr-4 inline h-10 w-10" />
          GitHub
        </a>
      </div>
    </div>
  </div>
);
