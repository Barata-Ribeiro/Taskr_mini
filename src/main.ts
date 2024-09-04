import "the-new-css-reset/css/reset.css"

// Elements
const formAdd = document.querySelector<HTMLFormElement>("#taskr_form-add") as HTMLFormElement
const inputAdd = document.querySelector<HTMLInputElement>("#inputAdd") as HTMLInputElement
const btnAdd = document.querySelector<HTMLButtonElement>("#btnAdd") as HTMLButtonElement

const formEdit = document.querySelector<HTMLFormElement>("#taskr_form-edit") as HTMLFormElement
const inputEdit = document.querySelector<HTMLInputElement>("#inputEdit") as HTMLInputElement
const btnCancel = document.querySelector<HTMLButtonElement>("#btnCancel") as HTMLButtonElement

const formSearch = document.querySelector<HTMLFormElement>("#taskr_form-search") as HTMLFormElement
const inputSearch = document.querySelector<HTMLInputElement>("#inputSearch") as HTMLInputElement
const btnSearchCancel = document.querySelector<HTMLButtonElement>("#btnSearchCancel") as HTMLButtonElement

const selectFilter = document.querySelector<HTMLSelectElement>("#selectFilter") as HTMLSelectElement

const list = document.querySelector<HTMLUListElement>("#taskr_list") as HTMLUListElement

// Fns
function saveTask(inputValue: string) {
    const item = itemFactory(inputValue)
    list.appendChild(item)
    inputAdd.value = ""
    inputAdd.focus()
}

function itemFactory(inputValue: string) {
    const item = document.createElement("li")
    item.setAttribute("class", "task-item")
    item.id = `taskr_item_${ Date.now() }`
    
    const taskTitle = document.createElement("h3")
    taskTitle.setAttribute("class", "task-text")
    taskTitle.textContent = inputValue
    item.appendChild(taskTitle)
    
    const taskActions = itemActionsFactory()
    item.appendChild(taskActions)
    
    return item
}

function itemActionsFactory() {
    const taskActions = document.createElement("div")
    taskActions.setAttribute("class", "task-actions")
    
    const btnDone = document.createElement("button")
    btnDone.setAttribute("class", "mini-btn mini-finish-btn")
    btnDone.setAttribute("title", "Finish task")
    btnDone.setAttribute("aria-label", "Finish task")
    const iconAdd = document.createElement("i")
    iconAdd.setAttribute("class", "fa-solid fa-check")
    btnDone.appendChild(iconAdd)
    taskActions.appendChild(btnDone)
    
    const btnEdit = document.createElement("button")
    btnEdit.setAttribute("class", "mini-btn mini-edit-btn")
    btnEdit.setAttribute("title", "Edit task")
    btnEdit.setAttribute("aria-label", "Edit task")
    const iconEdit = document.createElement("i")
    iconEdit.setAttribute("class", "fa-solid fa-pen")
    btnEdit.appendChild(iconEdit)
    taskActions.appendChild(btnEdit)
    
    const btnRemove = document.createElement("button")
    btnRemove.setAttribute("class", "mini-btn mini-remove-btn")
    btnRemove.setAttribute("title", "Remove task")
    btnRemove.setAttribute("aria-label", "Remove task")
    const iconDelete = document.createElement("i")
    iconDelete.setAttribute("class", "fa-solid fa-trash")
    btnRemove.appendChild(iconDelete)
    taskActions.appendChild(btnRemove)
    
    btnDone.setAttribute("type", "button")
    btnEdit.setAttribute("type", "button")
    btnRemove.setAttribute("type", "button")
    
    return taskActions
}

function showOrHideElements() {
    formEdit.classList.toggle("hidden")
    formAdd.classList.toggle("hidden")
    list.classList.toggle("hidden")
}

// Events
formAdd.addEventListener("submit", (e) => {
    e.preventDefault()
    const inputValue = inputAdd.value.trim()
    if (inputValue) {
        saveTask(inputValue)
    }
})

list.addEventListener("click", (e) => {
    const targetEl = e.target as HTMLButtonElement
    let taskId: string
    
    if (targetEl.tagName.toLowerCase() === "i") {
        targetEl.parentElement?.click()
    }
    
    const parentEl = targetEl.parentElement as HTMLDivElement
    const parentItemEl = parentEl.parentElement as HTMLLIElement
    
    if (parentItemEl?.classList.contains("task-item")) {
        taskId = parentItemEl.id
        console.log("Task ID: ", taskId)
    }
    
    if (targetEl.classList.contains("mini-finish-btn")) {
        const parentItemEl = parentEl.parentElement as HTMLLIElement
        parentItemEl.classList.toggle("done")
    }
    
    if (targetEl.classList.contains("mini-edit-btn")) {
        showOrHideElements()
    }
    
    if (targetEl.classList.contains("mini-remove-btn")) {
        const parentItemEl = parentEl.parentElement as HTMLLIElement
        parentItemEl.remove()
    }
})

btnCancel.addEventListener("click", () => {
    showOrHideElements()
})