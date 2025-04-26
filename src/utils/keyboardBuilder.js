
function createPaginationKeyboard(baseCallbackData, currentPage, totalPages) {
  const keyboard = [];
  const row = [];
  
  
  if (currentPage > 1) {
    row.push({
      text: '« Previous',
      callback_data: `${baseCallbackData}:${currentPage - 1}`
    });
  }
  
  
  row.push({
    text: `📄 ${currentPage} / ${totalPages}`,
    callback_data: 'noop' 
  });
  

  if (currentPage < totalPages) {
    row.push({
      text: 'Next »',
      callback_data: `${baseCallbackData}:${currentPage + 1}`
    });
  }
  
  keyboard.push(row);
  
  return {
    inline_keyboard: keyboard
  };
}

function createCustomKeyboard(buttons, backButton = null) {
  const keyboard = [];
  
  
  buttons.forEach(button => {
    
    if (Array.isArray(button)) {
      keyboard.push(button);
    } else {
      
      keyboard.push([button]);
    }
  });
  
  
  if (backButton) {
    keyboard.push([{
      text: backButton[0],
      callback_data: backButton[1]
    }]);
  }
  
  return {
    inline_keyboard: keyboard
  };
}

function createActionButton(text, action, isUrl = false) {
  if (isUrl) {
    return { text, url: action };
  } else {
    return { text, callback_data: action };
  }
}

function createButtonGrid(buttons, columns = 2) {
  const grid = [];
  
  
  for (let i = 0; i < buttons.length; i += columns) {
    const row = buttons.slice(i, i + columns);
    grid.push(row);
  }
  
  return grid;
}

module.exports = {
  createPaginationKeyboard,
  createCustomKeyboard,
  createActionButton,
  createButtonGrid
};