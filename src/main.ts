import "the-new-css-reset/css/reset.css"

interface Task {
    id: string
    task: string
    status: string
    createdAt: string
}

const DB_NAME = "taskr"
const DB_VERSION = 1
const DB_STORE_NAME = "tb_tasks"

let DB: IDBDatabase


(function() {
    const indexedDB = window.indexedDB
    
    console.log("Opening Db...")
    
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onsuccess = () => {
        DB = request.result
        console.log(`Database ${ DB_NAME } opened successfully!`)
    }
    
    request.onerror = (e) => {
        console.group("Error")
        console.error("Error opening Database: ", DB_NAME)
        console.error("Error: ", e)
    }
    
    request.onupgradeneeded = (e) => {
        console.log("Upgrading Database...")
        
        const store = (e.currentTarget as IDBOpenDBRequest).result.createObjectStore(DB_STORE_NAME, {
            keyPath: "id",
        })
        
        store.createIndex("id", "id", { unique: true })
        store.createIndex("task", "task", { unique: false })
        store.createIndex("status", "status", { unique: false })
        store.createIndex("createdAt", "createdAt", { unique: false })
    }
    
    
    // Elements
    const formAdd = document.querySelector<HTMLFormElement>("#taskr_form-add") as HTMLFormElement
    const inputAdd = document.querySelector<HTMLInputElement>("#inputAdd") as HTMLInputElement
    // const btnAdd = document.querySelector<HTMLButtonElement>("#btnAdd") as HTMLButtonElement
    const formEdit = document.querySelector<HTMLFormElement>("#taskr_form-edit") as HTMLFormElement
    const inputEdit = document.querySelector<HTMLInputElement>("#inputEdit") as HTMLInputElement
    const btnCancel = document.querySelector<HTMLButtonElement>("#btnCancel") as HTMLButtonElement
    // const formSearch = document.querySelector<HTMLFormElement>("#taskr_form-search") as HTMLFormElement
    const inputSearch = document.querySelector<HTMLInputElement>("#inputSearch") as HTMLInputElement
    const btnSearchCancel = document.querySelector<HTMLButtonElement>("#btnSearchCancel") as HTMLButtonElement
    // const selectFilter = document.querySelector<HTMLSelectElement>("#selectFilter") as HTMLSelectElement
    const list = document.querySelector<HTMLUListElement>("#taskr_list") as HTMLUListElement
    
    let editingTaskId: string
    
    // Fns
    function getObjectStore(storeName: string, mode: IDBTransactionMode) {
        const tx = DB.transaction(storeName, mode)
        return tx.objectStore(storeName)
    }
    
    function fetchAndRenderTasks() {
        const store = getObjectStore(DB_STORE_NAME, "readonly")
        const request = store.getAll()
        
        request.onsuccess = () => {
            const tasks = request.result
            
            for (const task of tasks) {
                const item = itemFactory(task)
                list.appendChild(item)
            }
        }
        
        request.onerror = (e) => {
            console.group("Error")
            console.error("Error fetching tasks")
            console.error("Error: ", e)
        }
    }
    
    function saveTask(inputValue: string) {
        const store = getObjectStore(DB_STORE_NAME, "readwrite")
        let request: IDBRequest
        
        const timestamp = Date.now()
        const taskId = "taskr_item_" + timestamp
        
        const taskObj = {
            id: taskId,
            task: inputValue,
            status: "pending",
            createdAt: new Date(timestamp).toISOString(),
        }
        
        request = store.add(taskObj)
        
        request.onsuccess = () => {
            console.log("Task added successfully!")
            
            const item = itemFactory(taskObj)
            list.appendChild(item)
        }
        
        request.onerror = (e) => {
            console.group("Error")
            console.error("Error adding task: ", inputValue)
            console.error("Error: ", e)
        }
        
        inputAdd.value = ""
        inputAdd.focus()
    }
    
    function itemFactory(taskObj: Task) {
        const item = document.createElement("li")
        item.setAttribute("class", "task-item")
        item.id = taskObj.id
        taskObj.status === "done" && item.classList.add("done")
        
        const taskTitle = document.createElement("h3")
        taskTitle.setAttribute("class", "task-text")
        taskTitle.textContent = taskObj.task
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
    
    function updateTask(inputValue: string) {
        const store = getObjectStore(DB_STORE_NAME, "readwrite")
        const request = store.get(editingTaskId)
        
        request.onsuccess = (e) => {
            const result = request.result
            
            if (!result) {
                console.group("Error")
                console.error("Task not found: ", editingTaskId)
                console.error("Error: ", e)
                console.groupEnd()
                
                return
            }
            
            result.task = inputValue
            
            const updateRequest = store.put(result)
            
            updateRequest.onsuccess = () => {
                console.log("Task updated successfully!")
                
                const taskItem = document.getElementById(editingTaskId) as HTMLLIElement
                if (taskItem) {
                    const taskText = taskItem.querySelector(".task-text") as HTMLHeadingElement
                    taskText.textContent = inputValue
                }
                
                inputEdit.value = ""
            }
            
            updateRequest.onerror = (e) => {
                console.group("Error")
                console.error("Error updating task: ", inputValue)
                console.error("Error: ", e)
            }
        }
    }
    
    function searchTasks(searchParam: string) {
        // TODO: Implement search tasks
        console.log("Search Param: ", searchParam)
    }
    
    // Events
    formAdd.addEventListener("submit", (e) => {
        e.preventDefault()
        const inputValue = inputAdd.value.trim()
        if (inputValue) {
            saveTask(inputValue)
        }
    })
    
    formEdit.addEventListener("submit", (e) => {
        e.preventDefault()
        
        const inputValue = inputEdit.value.trim()
        
        if (inputValue) {
            updateTask(inputValue)
        }
        
        showOrHideElements()
    })
    
    btnCancel.addEventListener("click", () => {
        showOrHideElements()
    })
    
    btnSearchCancel.addEventListener("click", () => {
        inputSearch.value = ""
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
            
            if (!taskId) {
                console.error("Invalid task id: ", taskId)
                return
            }
        }
        
        if (targetEl.classList.contains("mini-finish-btn")) {
            const parentItemEl = parentEl.parentElement as HTMLLIElement
            parentItemEl.classList.toggle("done")
            
            taskId = parentItemEl.id
            
            const store = getObjectStore(DB_STORE_NAME, "readwrite")
            const request = store.get(taskId)
            
            request.onsuccess = () => {
                const task = request.result
                
                if (!task) {
                    console.group("Error")
                    console.error("Task not found: ", taskId)
                    console.error("Error: ", e)
                    console.groupEnd()
                    return
                }
                
                task.status = task.status === "pending" ? "done" : "pending"
                
                const updateRequest = store.put(task)
                
                updateRequest.onsuccess = () => {
                    console.log("Task updated successfully!")
                }
                
                updateRequest.onerror = (e) => {
                    console.group("Error")
                    console.error("Error updating task: ", taskId)
                    console.error("Error: ", e)
                }
            }
            
            request.onerror = (e) => {
                console.group("Error")
                console.error("Error fetching task: ", taskId)
                console.error("Error: ", e)
                console.groupEnd()
            }
        }
        
        if (targetEl.classList.contains("mini-edit-btn")) {
            showOrHideElements()
            
            inputEdit.value = parentItemEl.querySelector(".task-text")?.textContent as string
            editingTaskId = parentItemEl.id
            
            console.log("Editing Task Id: ", editingTaskId)
            
            inputEdit.focus()
        }
        
        if (targetEl.classList.contains("mini-remove-btn")) {
            const parentItemEl = parentEl.parentElement as HTMLLIElement
            parentItemEl.remove()
        }
    })
    
    inputSearch.addEventListener("keyup", (e) => {
        const target = e.target as HTMLInputElement
        if (target) {
            const searchParam = target.value.trim().toLowerCase()
            searchTasks(searchParam)
        }
        
    })
    
    request.onsuccess = () => {
        DB = request.result
        console.log(`Database ${ DB_NAME } opened successfully!`)
        fetchAndRenderTasks()
    }
})()