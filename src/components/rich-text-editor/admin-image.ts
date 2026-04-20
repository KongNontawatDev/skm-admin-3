import Image from '@tiptap/extension-image'

export const AdminImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-align'),
        renderHTML: (attributes) => {
          if (!attributes.align) return {}
          return { 'data-align': attributes.align }
        },
      },
    }
  },
}).configure({
  allowBase64: true,
  resize: {
    enabled: true,
    minWidth: 80,
    minHeight: 60,
    directions: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
  },
})
