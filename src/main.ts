import "the-new-css-reset/css/reset.css"

type TaskStatus = "pending" | "done"

interface Task {
    id: string
    task: string
    status: TaskStatus
    createdAt: string
}

const DB_NAME = "taskr"
const DB_VERSION = 1
const DB_STORE_NAME = "tb_tasks"
let DB: IDBDatabase

(function() {
    const indexedDB = window.indexedDB
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onsuccess = () => {
        DB = request.result
        fetchAndRenderTasks()
    }
    
    request.onerror = (e) => console.error("Error opening Database: ", e)
    
    request.onupgradeneeded = (e) => {
        const store = (e.currentTarget as IDBOpenDBRequest).result.createObjectStore(DB_STORE_NAME, { keyPath: "id" })
        store.createIndex("id", "id", { unique: true })
        store.createIndex("task", "task", { unique: false })
        store.createIndex("status", "status", { unique: false })
        store.createIndex("createdAt", "createdAt", { unique: false })
    }
    
    /* DOM Elements */
    const formAdd = document.querySelector<HTMLFormElement>("#taskr_form-add")!
    const inputAdd = document.querySelector<HTMLInputElement>("#inputAdd")!
    const btnAdd = document.querySelector<HTMLButtonElement>("#btnAdd")!
    const formEdit = document.querySelector<HTMLFormElement>("#taskr_form-edit")!
    const inputEdit = document.querySelector<HTMLInputElement>("#inputEdit")!
    const btnCancel = document.querySelector<HTMLButtonElement>("#btnCancel")!
    const formSearch = document.querySelector<HTMLFormElement>("#taskr_form-search")!
    const inputSearch = document.querySelector<HTMLInputElement>("#inputSearch")!
    const btnSearchCancel = document.querySelector<HTMLButtonElement>("#btnSearchCancel")!
    const selectFilter = document.querySelector<HTMLSelectElement>("#selectFilter")!
    const list = document.querySelector<HTMLUListElement>("#taskr_list")!
    
    let editingTaskId: string
    
    /* Functions */
    function getObjectStore(storeName: string, mode: IDBTransactionMode) {
        return DB.transaction(storeName, mode).objectStore(storeName)
    }
    
    function fetchAndRenderTasks() {
        const store = getObjectStore(DB_STORE_NAME, "readonly")
        const request = store.getAll()
        
        request.onsuccess = () => {
            request.result.sort((a: Task, b: Task) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            while (list.firstChild) list.removeChild(list.firstChild)
            request.result.forEach((task: Task) => list.appendChild(itemFactory(task)))
        }
        
        request.onerror = (e) => console.error("Error fetching tasks: ", e)
    }
    
    function saveTask(inputValue: string) {
        const store = getObjectStore(DB_STORE_NAME, "readwrite")
        
        const taskObj: Task = {
            id: "taskr_item_" + Date.now(),
            task: inputValue,
            status: "pending",
            createdAt: new Date().toISOString(),
        }
        
        const request = store.add(taskObj)
        
        request.onsuccess = () => list.prepend(itemFactory(taskObj))
        
        request.onerror = (e) => console.error("Error adding task: ", e)
        
        inputAdd.value = ""
        inputAdd.focus()
    }
    
    function itemFactory(taskObj: Task) {
        const item = document.createElement("li")
        item.className = "task-item"
        item.id = taskObj.id
        if (taskObj.status === "done") item.classList.add("done")
        
        const taskTitle = document.createElement("h3")
        taskTitle.className = "task-text"
        taskTitle.textContent = taskObj.task
        item.appendChild(taskTitle)
        
        item.appendChild(itemActionsFactory())
        return item
    }
    
    function itemActionsFactory() {
        const taskActions = document.createElement("div")
        taskActions.className = "task-actions"
        
        const btnDone = createButton("mini-btn mini-finish-btn", "Finish task", "fa-solid fa-check")
        const btnEdit = createButton("mini-btn mini-edit-btn", "Edit task", "fa-solid fa-pen")
        const btnRemove = createButton("mini-btn mini-remove-btn", "Remove task", "fa-solid fa-trash")
        
        taskActions.append(btnDone, btnEdit, btnRemove)
        return taskActions
    }
    
    function createButton(btnClass: string, title: string, iconClass: string) {
        const btn = document.createElement("button")
        btn.className = btnClass
        btn.title = title
        btn.ariaLabel = title
        btn.type = "button"
        
        const icon = document.createElement("i")
        icon.className = iconClass
        btn.appendChild(icon)
        
        return btn
    }
    
    function showOrHideElements() {
        formEdit.classList.toggle("hidden")
        formAdd.classList.toggle("hidden")
        list.classList.toggle("hidden")
    }
    
    function updateTask(inputValue: string) {
        const store = getObjectStore(DB_STORE_NAME, "readwrite")
        const request = store.get(editingTaskId)
        
        request.onsuccess = () => {
            const result = request.result
            if (!result) return console.error("Task not found: ", editingTaskId)
            
            result.task = inputValue
            const updateRequest = store.put(result)
            
            updateRequest.onsuccess = () => {
                const taskItem = document.getElementById(editingTaskId) as HTMLLIElement
                if (taskItem) taskItem.querySelector(".task-text")!.textContent = inputValue
                inputEdit.value = ""
            }
            
            updateRequest.onerror = (e) => console.error("Error updating task: ", e)
        }
    }
    
    function searchTasks(searchParam: string) {
        const store = getObjectStore(DB_STORE_NAME, "readonly")
        const index = store.index("task")
        const results: Task[] = []
        
        index.openCursor().onsuccess = (e) => {
            const cursor = (e.target as IDBRequest).result
            if (cursor) {
                if (cursor.value.task.toLowerCase().includes(searchParam)) results.push(cursor.value)
                cursor.continue()
            } else {
                list.innerHTML = ""
                results.forEach((task: Task) => list.appendChild(itemFactory(task)))
                
                if (results.length === 0) {
                    const noResults = document.createElement("li")
                    noResults.textContent = "No results found."
                    list.appendChild(noResults)
                }
            }
        }
        
        index.openCursor().onerror = (e) => console.error("Error searching tasks: ", e)
    }
    
    /* Event Listeners */
    formAdd.addEventListener("submit", (e) => {
        e.preventDefault()
        const inputValue = inputAdd.value.trim()
        if (inputValue) saveTask(inputValue)
    })
    btnAdd.addEventListener("click", () => inputAdd.focus())
    
    formEdit.addEventListener("submit", (e) => {
        e.preventDefault()
        const inputValue = inputEdit.value.trim()
        if (inputValue) updateTask(inputValue)
        showOrHideElements()
    })
    
    btnCancel.addEventListener("click", showOrHideElements)
    btnSearchCancel.addEventListener("click", () => {
        inputSearch.value = ""
        fetchAndRenderTasks()
    })
    
    list.addEventListener("click", (e) => {
        const targetEl = e.target as HTMLButtonElement
        if (targetEl.tagName.toLowerCase() === "i") targetEl.parentElement?.click()
        
        const parentItemEl = targetEl.closest(".task-item") as HTMLLIElement
        if (!parentItemEl) return
        
        const taskId = parentItemEl.id
        if (!taskId) return console.error("Invalid task id: ", taskId)
        
        if (targetEl.classList.contains("mini-finish-btn")) {
            parentItemEl.classList.toggle("done")
            const store = getObjectStore(DB_STORE_NAME, "readwrite")
            const request = store.get(taskId)
            
            request.onsuccess = () => {
                const task = request.result
                if (!task) return console.error("Task not found: ", taskId)
                
                task.status = task.status === "pending" ? "done" : "pending"
                const updateRequest = store.put(task)
                updateRequest.onerror = (e) => console.error("Error updating task: ", e)
            }
            
            request.onerror = (e) => console.error("Error fetching task: ", e)
        }
        
        if (targetEl.classList.contains("mini-edit-btn")) {
            showOrHideElements()
            inputEdit.value = parentItemEl.querySelector(".task-text")!.textContent!
            editingTaskId = taskId
            inputEdit.focus()
        }
        
        if (targetEl.classList.contains("mini-remove-btn")) {
            const store = getObjectStore(DB_STORE_NAME, "readwrite")
            const request = store.delete(taskId)
            
            request.onsuccess = () => parentItemEl.remove()
            request.onerror = (e) => console.error("Error deleting task: ", e)
        }
    })
    
    formSearch.addEventListener("submit", (e) => e.preventDefault())
    
    inputSearch.addEventListener("keyup", (e) => {
        e.preventDefault()
        const searchParam = (e.target as HTMLInputElement).value.trim().toLowerCase()
        searchTasks(searchParam)
    })
    
    selectFilter.addEventListener("change", (e) => {
        const filterValue = (e.target as HTMLSelectElement).value
        const store = getObjectStore(DB_STORE_NAME, "readonly")
        const index = store.index("status")
        
        switch (filterValue) {
            case "pending":
                index.getAll("pending").onsuccess = (e) => {
                    list.innerHTML = ""
                    const result = (e.target as IDBRequest).result
                    result.forEach((task: Task) => list.appendChild(itemFactory(task)))
                }
                break
            case "done":
                index.getAll("done").onsuccess = (e) => {
                    list.innerHTML = ""
                    const result = (e.target as IDBRequest).result
                    result.forEach((task: Task) => list.appendChild(itemFactory(task)))
                }
                break
            default:
                fetchAndRenderTasks()
        }
    })
})()