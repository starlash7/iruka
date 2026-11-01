export const libraryChanged='iruka:library-changed';
export function notifyLibrary(){window.dispatchEvent(new Event(libraryChanged));}
