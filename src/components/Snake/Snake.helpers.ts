// credit goes to https://github.com/wojtekmaj/detect-element-overflow for writing these overflow helpers.
// i just want to own them in the code in case i choose to refactor them a bit since they are relatively simple.
export function getRect(element: HTMLElement) {
  return element.getBoundingClientRect();
}

export function detectElementOverflow(
  element: HTMLElement,
  container: HTMLElement,
) {
  return {
    get collidedTop() {
      return getRect(element).top < getRect(container).top;
    },
    get collidedBottom() {
      return getRect(element).bottom > getRect(container).bottom;
    },
    get collidedLeft() {
      return getRect(element).left < getRect(container).left;
    },
    get collidedRight() {
      return getRect(element).right > getRect(container).right;
    },
    get overflowTop() {
      return getRect(container).top - getRect(element).top;
    },
    get overflowBottom() {
      return getRect(element).bottom - getRect(container).bottom;
    },
    get overflowLeft() {
      return getRect(container).left - getRect(element).left;
    },
    get overflowRight() {
      return getRect(element).right - getRect(container).right;
    },
  };
}

// these names are so cryptic... please feel free to suggest better names!

function calculateOffsets(
  originElement: HTMLElement,
  relativeElement: HTMLElement,
) {
  return {
    get rightOffset() {
      return getRect(originElement).right - getRect(relativeElement).left;
    },
    get bottomOffset() {
      return getRect(originElement).bottom - getRect(relativeElement).top;
    },
    get leftOffset() {
      return getRect(originElement).left - getRect(relativeElement).right;
    },
    get topOffset() {
      return getRect(originElement).top - getRect(relativeElement).bottom;
    },
  };
}
export function detectMaximumGap(
  growingElement: HTMLElement,
  wallElement: HTMLElement,
) {
  return {
    // will be zero if element is inset in wall in that particular axis
    get rowGap() {
      return Math.max(
          0,
          calculateOffsets(wallElement, growingElement).leftOffset,
          -calculateOffsets(wallElement, growingElement).rightOffset,
        );
    },
    get columnGap() {
      return Math.max(
        0,
        calculateOffsets(wallElement, growingElement).topOffset,
        -calculateOffsets(wallElement, growingElement).bottomOffset,
      );
    },
  };
}
