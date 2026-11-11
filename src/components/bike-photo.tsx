import { Bike } from "lucide-react";

type BikePhotoProps = {
  size: "small" | "medium" | "large";
};

const BOX_CLASSES: Record<BikePhotoProps["size"], string> = {
  small: "size-10 rounded-lg",
  medium: "aspect-4/3 w-full rounded-lg",
  large: "aspect-4/3 w-full rounded-xl",
};

const ICON_CLASSES: Record<BikePhotoProps["size"], string> = {
  small: "size-5",
  medium: "size-10",
  large: "size-16",
};

// TODO(slice 1.3): show the real photo. Until then, a bike icon.
export function BikePhoto({ size }: BikePhotoProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-muted text-muted-foreground ${BOX_CLASSES[size]}`}
    >
      <Bike className={ICON_CLASSES[size]} strokeWidth={1.5} />
    </div>
  );
}
