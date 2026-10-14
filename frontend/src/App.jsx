import { useState, useEffect } from "react"; /* useeffect backend pe tasks ko update kre ga or Ye React ko page load hone par backend se tasks fetch karne ka kaam karne dega. */ 

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState("All");
  const [editingTaskId, setEditingTaskId] = useState(null);  /* for editing tasks */
/* fetch(...) tumhare Express backend ko request bhejta hai.
response.json() backend se aane wale JSON data ko read karta hai.
setTasks(data) MongoDB se milne wale tasks React state mein rakhta hai.
[ ] ka matlab hai ke effect component ke mount hone par run hota hai. */  

useEffect(function () {
  fetch("http://localhost:5000/api/tasks")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load tasks");
      }

      return response.json();
    })
    .then(function (data) {
      const formattedTasks = data.map(function (task) {
        return {
          ...task,
          id: task._id,
        };
      });

      setTasks(formattedTasks);
    })
    .catch(function (error) {
      console.error("Error loading tasks:", error);
    });
}, []);
/* Tumhare React code mein buttons task.id use karte hain, jabke MongoDB tasks ki actual ID _id hoti hai.
Ye code database se milne wale har task mein id add karta hai, taake tumhara existing Edit, Complete aur Delete code us task ko identify kar sake.*/

/* async aur await backend ke response ka wait karte hain.
POST naya task MongoDB mein save karta hai.
PATCH existing task ko update karta hai.
JSON.stringify(taskData) task ki details JSON format mein bhejta hai.
setTasks() successful response milne ke baad React list update karta hai.*/
 

async function addTask(event) {
  event.preventDefault();

  if (title.trim() === "") {
    return;
  }

  const taskData = {
    title: title.trim(),
    subject: subject.trim() || "General",
    priority: priority,
    dueDate: dueDate,
    completed: false,
  };

  try {
    if (editingTaskId !== null) {
      // Update an existing task in MongoDB
      const response = await fetch(
        `http://localhost:5000/api/tasks/${editingTaskId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      const updatedTask = await response.json();

      setTasks(function (previousTasks) {
        return previousTasks.map(function (task) {
          return task._id === updatedTask._id
            ? updatedTask
            : task;
        });
      });
    } else {
      // Create a new task in MongoDB
      const response = await fetch(
        "http://localhost:5000/api/tasks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      const savedTask = await response.json();

      setTasks(function (previousTasks) {
        return [savedTask, ...previousTasks];
      });
    }

    setTitle("");
    setSubject("");
    setPriority("Medium");
    setDueDate("");
    setEditingTaskId(null);
  } catch (error) {
    console.error("Error saving task:", error);
    alert("Task save nahi hua. Please check your backend.");
  }
}

function editTask(task) {
  setEditingTaskId(task.id);

  setTitle(task.title);
  setSubject(task.subject === "General" ? "" : task.subject);
  setPriority(task.priority);
  setDueDate(task.dueDate || "");

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function cancelEdit() {
  setEditingTaskId(null);
  setTitle("");
  setSubject("");
  setPriority("Medium");
  setDueDate("");
}

/* function for showing completeion status on frontend before moving to backend
  function toggleTask(id) {
    setTasks(
      tasks.map(function (task) {
        if (task.id === id) {
          return {
            ...task,
            completed: !task.completed,
          };
        }

        return task;
      })
    );
  }
*/

async function toggleTask(id) {
  const task = tasks.find(function (task) {
    return task.id === id;
  });

  if (!task) {
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/tasks/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: !task.completed,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update task");
    }

    const updatedTask = await response.json();

    setTasks(function (previousTasks) {
      return previousTasks.map(function (task) {
        return task.id === id
          ? { ...updatedTask, id: updatedTask._id }
          : task;
      });
    });
  } catch (error) {
    console.error("Error updating task:", error);
    alert("Task status update nahi hua. Please try again.");
  }
}

/* simple delete task function without backend connected 
  function deleteTask(id) {
    setTasks(
      tasks.filter(function (task) {
        return task.id !== id;
      })
    );
  }
*/

async function deleteTask(id) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/tasks/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete task");
    }

    setTasks(function (previousTasks) {
      return previousTasks.filter(function (task) {
        return task.id !== id;
      });
    });

  } catch (error) {
    console.error("Error deleting task:", error);
    alert("Task delete nahi hua. Please try again.");
  }
}
/* new delete function
async — function ko asynchronous operations perform karne deta hai.
fetch(...) — backend ko request bhejta hai.
method: "DELETE" — backend ko batata hai ke task delete karna hai.
${id} — us specific task ki ID bhejta hai.
response.ok — check karta hai ke request successful hui ya nahi.
setTasks(...) — successful deletion ke baad task frontend ki list se bhi remove karta hai.
catch — agar request fail ho, to error show karta hai.*/
  const completedCount = tasks.filter(
    function (task) {
      return task.completed;
    }
  ).length;

  const pendingCount = tasks.length - completedCount;

  const progress = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;

  const visibleTasks = tasks.filter(function (task) {
    if (filter === "Completed") {
      return task.completed;
    }

    if (filter === "Pending") {
      return !task.completed;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">

      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">
              StudyFlow
            </h1>
            <p className="text-sm text-slate-500">
              Your student task manager
            </p>
          </div>

          <span className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium">
            My Workspace
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">

        {/* Welcome */}
        <section className="mb-8">
          <p className="text-indigo-600 font-semibold text-sm">
            STUDENT DASHBOARD
          </p>

          <h2 className="text-3xl font-bold mt-2">
            Organize your studies 📚
          </h2>

          <p className="text-slate-500 mt-2">
            Plan your work, track your progress, and stay focused.
          </p>
        </section>

        {/* Statistics */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">

          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-sm">Total Tasks</p>
            <h3 className="text-3xl font-bold mt-3">{tasks.length}</h3>
            <p className="text-sm text-slate-400 mt-2">
              All your study tasks
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-sm">Pending Tasks</p>
            <h3 className="text-3xl font-bold text-amber-500 mt-3">
              {pendingCount}
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Still to be completed
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-sm">Completed Tasks</p>
            <h3 className="text-3xl font-bold text-emerald-600 mt-3">
              {completedCount}
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Tasks finished
            </p>
          </div>

        </section>

        {/* Progress */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 mb-8">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">Your Progress</h3>
            <span className="font-semibold text-indigo-600">
              {progress}%
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: progress + "%" }}
            />
          </div>

          <p className="text-sm text-slate-500 mt-3">
            {completedCount} of {tasks.length} tasks completed
          </p>
        </section>

        {/* Add Task Form */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 mb-8">

          <h3 className="text-xl font-bold mb-5">
           {editingTaskId !== null ? "Edit Task" : "Add a New Task"}
           </h3>

          <form onSubmit={addTask} className="space-y-4">

            <div>
              <label className="block text-sm font-medium mb-2">
                Task Title *
              </label>

              <input
                type="text"
                placeholder="e.g. Complete React assignment"
                value={title}
                onChange={function (event) {
                  setTitle(event.target.value);
                }}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              <div>
                <label className="block text-sm font-medium mb-2">
                  Subject
                </label>

                <input
                  type="text"
                  placeholder="e.g. Web Development"
                  value={subject}
                  onChange={function (event) {
                    setSubject(event.target.value);
                  }}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Priority
                </label>

                <select
                  value={priority}
                  onChange={function (event) {
                    setPriority(event.target.value);
                  }}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Due Date
                </label>

                <input
                  type="date"
                  value={dueDate}
                  onChange={function (event) {
                    setDueDate(event.target.value);
                  }}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white"
                />
              </div>

            </div>

            
<div className="flex gap-3 flex-wrap">
  <button
    type="submit"
    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition"
  >
    {editingTaskId !== null ? "Update Task" : "+ Add Task"}
  </button>

  {editingTaskId !== null && (
    <button
      type="button"
      onClick={cancelEdit}
      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-xl transition"
    >
      Cancel
    </button>
  )}
</div>


          </form>
        </section>

        {/* Task List */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200">

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">

            <h3 className="text-xl font-bold">My Tasks</h3>

            <div className="flex gap-2 flex-wrap">
              {["All", "Pending", "Completed"].map(function (option) {
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={function () {
                      setFilter(option);
                    }}
                    className={
                      "px-4 py-2 rounded-lg text-sm font-medium " +
                      (filter === option
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                    }
                  >
                    {option}
                  </button>
                );
              })}
            </div>

          </div>

          {visibleTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📝</p>
              <h4 className="font-semibold text-lg">No tasks found</h4>
              <p className="text-slate-500 text-sm mt-2">
                Add a task above to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">

              {visibleTasks.map(function (task) {
                return (
                  <div
                    key={task.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-slate-200 rounded-xl hover:border-indigo-200"
                  >

                    <div className="flex items-start gap-3">

                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={function () {
                          toggleTask(task.id);
                        }}
                        aria-label={"Complete " + task.title}
                        className="w-5 h-5 mt-1 accent-indigo-600 cursor-pointer"
                      />

                      <div>
                        <h4
                          className={
                            "font-semibold " +
                            (task.completed
                              ? "line-through text-slate-400"
                              : "text-slate-800")
                          }
                        >
                          {task.title}
                        </h4>

                        <p className="text-sm text-slate-500 mt-1">
                          {task.subject}
                          {task.dueDate ? " • Due: " + task.dueDate : ""}
                        </p>

                        <span
                          className={
                            "inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full " +
                            (task.priority === "High"
                              ? "bg-red-100 text-red-700"
                              : task.priority === "Medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700")
                          }
                        >
                          {task.priority} Priority
                        </span>
                      </div>

                    </div>
                       
                    <button
                      type="button"
                      onClick={function () {
                        editTask(task);
                      }}
                      className="self-start sm:self-center text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={function () {
                        deleteTask(task.id);
                      }}
                      className="self-start sm:self-center text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Delete
                    </button>

                  </div>
                );
              })}

            </div>
          )}

        </section>

        <footer className="text-center text-sm text-slate-400 py-8">
          StudyFlow · Stay organized, keep learning ✨
        </footer>

      </main>
    </div>
  );
}

export default App;

