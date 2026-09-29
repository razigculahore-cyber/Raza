"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  ArrowUpIcon,
  CameraIcon,
  ImagePlusIcon,
  PaperclipIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_CONFIG } from "@/lib/config";
import type { ImageAttachment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

async function readImage(file: File): Promise<ImageAttachment> {
  if (!IMAGE_TYPES.has(file.type)) {
    throw new Error(`${file.name}: choose a PNG, JPG, or WEBP image.`);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`${file.name}: images must be 5 MB or smaller.`);
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Couldn't read the image."));
    reader.onerror = () => reject(new Error(`Couldn't read ${file.name}.`));
    reader.readAsDataURL(file);
  });

  return { data: dataUrl.slice(dataUrl.indexOf(",") + 1), mimeType: file.type };
}

export function Composer({
  onSend,
  onStop,
  streaming,
  disabled,
  placeholder = `Message ${APP_CONFIG.appName}…`,
  autoFocus,
}: {
  onSend: (text: string, images?: ImageAttachment[]) => void;
  onStop: () => void;
  streaming: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState("");
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && window.matchMedia("(min-width: 768px)").matches) ref.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const onShortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "u") {
        event.preventDefault();
        fileInput.current?.click();
      }
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  const addFiles = async (files: File[]) => {
    const accepted: ImageAttachment[] = [];
    for (const file of files) {
      try {
        accepted.push(await readImage(file));
      } catch (error) {
        toast.error((error as Error).message || "Couldn't read the image.");
      }
    }
    if (accepted.length) setImages((current) => [...current, ...accepted]);
  };

  const captureScreenshot = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      toast.error("Screen capture isn't available in this browser.");
      return;
    }

    let stream: MediaStream | undefined;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.85),
      );
      if (!blob) throw new Error("Couldn't capture the selected screen.");
      await addFiles([new File([blob], "screenshot.jpg", { type: "image/jpeg" })]);
    } catch (error) {
      if ((error as Error).name !== "NotAllowedError") {
        toast.error((error as Error).message || "Couldn't capture the selected screen.");
      }
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
    }
  };

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (streaming) return onStop();
    if ((!value.trim() && !images.length) || disabled) return;
    onSend(value, images);
    setValue("");
    setImages([]);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    const touch = window.matchMedia("(hover: none)").matches;
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && !touch) {
      event.preventDefault();
      submit();
    }
  };

  const canSend = streaming || ((!!value.trim() || images.length > 0) && !disabled);

  return (
    <form
      onSubmit={submit}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        void addFiles(Array.from(event.dataTransfer.files));
      }}
      className="mx-auto w-full max-w-3xl rounded-3xl border bg-card p-2.5 pl-4 shadow-sm transition-colors focus-within:border-ring"
    >
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2" aria-label="Attached images">
          {images.map((image, index) => (
            <div key={`${image.data.slice(0, 20)}-${index}`} className="relative size-16">
              <img
                src={`data:${image.mimeType};base64,${image.data}`}
                alt={`Image attachment ${index + 1}`}
                className="size-16 rounded-md border object-cover"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon-xs"
                aria-label={`Remove image ${index + 1}`}
                className="absolute -top-1.5 -right-1.5 rounded-full"
                onClick={() => setImages((current) => current.filter((_, i) => i !== index))}
              >
                <XIcon />
              </Button>
            </div>
          ))}
        </div>
      )}
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={(event) => {
          void addFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      <label htmlFor="composer" className="sr-only">
        Message
      </label>
      <textarea
        id="composer"
        ref={ref}
        rows={1}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onPaste={(event) => {
          const files = Array.from(event.clipboardData.items)
            .map((item) => item.getAsFile())
            .filter((file): file is File => file !== null);
          if (files.length) {
            event.preventDefault();
            void addFiles(files);
          }
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        enterKeyHint="send"
        className="field-sizing-content max-h-52 min-h-7 w-full resize-none bg-transparent py-1.5 text-[15px] leading-6 outline-none placeholder:text-muted-foreground"
      />
      <div className="mt-1 flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Add files or photos"
              disabled={disabled}
            >
              <PaperclipIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top">
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                fileInput.current?.click();
              }}
            >
              <ImagePlusIcon />
              Add files or photos (Ctrl+U)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void captureScreenshot()}>
              <CameraIcon />
              Take a screenshot
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          type="submit"
          size="icon"
          disabled={!canSend}
          aria-label={streaming ? "Stop generating" : "Send message"}
          className={cn("rounded-full", !canSend && "opacity-30")}
        >
          {streaming ? <SquareIcon className="size-3.5 fill-current" /> : <ArrowUpIcon />}
        </Button>
      </div>
    </form>
  );
}
