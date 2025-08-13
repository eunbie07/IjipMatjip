// CSS 애니메이션을 위한 스타일
export const injectRoomBoxStyles = () => {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  
  if (!document.head.querySelector('style[data-roombox-styles]')) {
    styleSheet.setAttribute('data-roombox-styles', 'true');
    document.head.appendChild(styleSheet);
  }
};