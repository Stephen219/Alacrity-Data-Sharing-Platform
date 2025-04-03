"use client";
import { Node } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";

export const PasteImage = Node.create({
  name: "pasteImagePlugin",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("pasteImagePlugin"),
        props: {
          handlePaste: (view, event) => {
            const clipboardData = event.clipboardData;
            if (!clipboardData?.items) return false;

            for (const item of clipboardData.items) {
              if (item.type.includes("image")) {
                const file = item.getAsFile();
                if (!file) return false;

                const reader = new FileReader();
                reader.onload = readerEvent => {
                  const base64src = readerEvent?.target?.result;
                  if (!base64src) return;

                  // Insert the image into the editor
                  const node = view.state.schema.nodes.image.create({ src: base64src });
                  const transaction = view.state.tr.replaceSelectionWith(node);
                  view.dispatch(transaction);
                };

                reader.readAsDataURL(file);
                // Return true so ProseMirror stops processing this paste event further
                return true;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});
