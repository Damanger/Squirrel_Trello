import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faAdd, faEdit } from '@fortawesome/free-solid-svg-icons';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc  } from 'firebase/firestore';
import firebase from 'firebase/compat/app';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import 'firebase/compat/auth';
import '../css/Home.css';

const firebaseConfig = {
    apiKey: "AIzaSyDMvttW6uWMalJiQLOlyJwaYdv9HNchHas",
    authDomain: "squirrel-trello.firebaseapp.com",
    projectId: "squirrel-trello",
    storageBucket: "squirrel-trello.appspot.com",
    messagingSenderId: "349870855963",
    appId: "1:349870855963:web:95b9eab2f8c0628978e5be",
    measurementId: "G-2NZBWTDLTQ"
};

const Home = () => {
    const [showModal, setShowModal] = useState(false); // Definir showModal y su función de actualización
    const [taskName, setTaskName] = useState(''); // Definir taskName y su función de actualización
    const [startDate, setStartDate] = useState(new Date()); // Definir startDate y su función de actualización
    const [endDate, setEndDate] = useState(new Date()); // Definir endDate y su función de actualización
    const [tag, setTag] = useState({ value: "", label: "" }); // Estado para el tag
    const [editingTask, setEditingTask] = useState(null);
    
    const handleOpenModal = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };
    const [userAuthenticated, setUserAuthenticated] = useState(false);
    const [tasks, setTasks] = useState({
        todo: [],
        doing: [],
        done: []
    });
    const [draggingOver, setDraggingOver] = useState(null);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserAuthenticated(true);
                fetchTasks(user); // Llama a la función para cargar las tareas del usuario
            } else {
                setUserAuthenticated(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Función para cargar las tareas del usuario desde la base de datos
    const fetchTasks = async (user) => {
        const db = getFirestore();
        const userTasksRef = collection(db, `tasks/${user.uid}/userTasks`);
    
        // Escucha los cambios en las tareas del usuario en tiempo real
        onSnapshot(userTasksRef, (snapshot) => {
            const fetchedTasks = { todo: [], doing: [], done: [] };
            snapshot.forEach((doc) => {
                const taskData = doc.data();
                fetchedTasks[taskData.status].push({ id: doc.id, ...taskData }); // Incluir todas las propiedades de la tarea
            });
            setTasks(fetchedTasks);
        });
    };
    

    // Verificar si el usuario está autenticado, si no, redirigir a la página de inicio
    if (!userAuthenticated) {
        return <Navigate to="/" />;
    }

    // Inicializar Firebase si no está inicializado
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // Función para manejar el inicio del arrastre
    const handleDragStart = (event, task, status) => {
        event.dataTransfer.setData('text/plain', JSON.stringify({ task, status }));
    };

    // Función para manejar la caída de la tarjeta en una columna
    const handleDrop = async (event, newStatus) => {
        event.preventDefault();
        const data = JSON.parse(event.dataTransfer.getData('text/plain'));
        const { task, status } = data;

        if (status !== newStatus) {
            const db = getFirestore();
            const user = getAuth().currentUser;
            const taskRef = doc(db, `tasks/${user.uid}/userTasks`, task.id);

            try {
                // Actualizar el estado de la tarea en la base de datos
                await updateDoc(taskRef, { status: newStatus });
            } catch (error) {
                console.error('Error updating task status:', error);
                return;
            }

            const updatedTasks = { ...tasks };
            const taskIndex = updatedTasks[status].findIndex(t => t.id === task.id);
            const movedTask = updatedTasks[status].splice(taskIndex, 1)[0];
            movedTask.status = newStatus;
            updatedTasks[newStatus].push(movedTask);
            setTasks(updatedTasks);
        }

        setDraggingOver(null); // Reinicia el estado de arrastre cuando se suelta la tarjeta
    };

    // Función para permitir que la tarjeta sea soltada en una columna
    const allowDrop = (event, column) => {
        event.preventDefault();
        setDraggingOver(column); // Actualiza la columna sobre la que se está arrastrando
    };

    // Función para manejar el envío del formulario
    const handleSubmit = (event) => {   
        event.preventDefault(); // Prevenir el comportamiento predeterminado del formulario
        // Verificar si todos los campos obligatorios están llenos
        if (taskName.trim() !== '' && tag.toString().trim() !== '') { // Convertir tag a cadena de texto
            // Verificar si la fecha final es mayor o igual a la fecha inicial
            if (endDate >= startDate) {
                // Llamar a la función handleAddTask con los datos del formulario
                handleAddTask({
                    taskName: taskName,
                    startDate: startDate,
                    endDate: endDate,
                    tag: tag
                });
            // Cerrar el modal después de agregar la tarea correctamente
            handleCloseModal();
            } else {
                // Mostrar mensaje de error si la fecha final es menor que la fecha inicial
                toast.error('End date must be greater than or equal to start date');
            }
        } else {
            // Mostrar mensaje de error si los campos obligatorios están vacíos
            toast.error('Please fill all required fields');
        }
    };

    // Función para agregar una nueva tarea
    const handleAddTask = async ({ taskName, startDate, endDate, tag }) => {
        const db = getFirestore();
        const user = getAuth().currentUser;
        const userTasksRef = collection(db, `tasks/${user.uid}/userTasks`);
        try {
            await addDoc(userTasksRef, { 
                task: taskName, 
                startDate: startDate, 
                endDate: endDate, 
                tag: tag.label,
                status: 'todo' 
            });
            // Limpiar los campos del formulario después de agregar la tarea
            setTaskName('');
            setStartDate(new Date());
            setEndDate(new Date());
            setTag({ value: "", label: "" }); // Restablecer el estado del tag
            // Mostrar mensaje de éxito
            toast.success('Task added correctly');
        } catch (error) {
            console.error('Error adding task:', error);
            toast.error('Something went wrong');
        }
    };

    // Función para eliminar una tarea
    const handleDeleteTask = async (status, taskId) => {
        const db = getFirestore();
        const user = getAuth().currentUser;
        const userTaskRef = doc(db, `tasks/${user.uid}/userTasks`, taskId);
        try {
            await deleteDoc(userTaskRef);
            toast.success('Deleted correctly');
        } catch (error) {
            console.error('Error deleting task:', error);
            toast.error('Something went wrong');
        }
    };

    // Función para manejar el cambio en el select
    const handleTagChange = (event) => {
        const value = event.target.value;
        const label = event.target.options[event.target.selectedIndex].text; // Obtener el texto de la opción seleccionada
        // Si el valor es una opción válida diferente a "Selecciona una opción", se actualiza el estado tag
        if (value !== "") {
            setTag({ value, label }); // Actualizar el estado tag con el valor y la etiqueta
        }
    };

    // Función para cerrar sesión
    const signOut = () => {
        firebase.auth().signOut().then(() => {
            console.log('Signed out');
        }).catch((error) => {
            console.error(error);
        });
    };

    // Función para calcular la diferencia de días entre dos fechas
    const calculateDaysDifference = (startDate, endDate) => {
        const oneDay = 24 * 60 * 60 * 1000; // horas * minutos * segundos * milisegundos
        const diffDays = Math.round(Math.abs((endDate - startDate) / oneDay)); // Redondear el resultado para obtener un número entero
        return diffDays;
    };

    // Función para ordenar las tareas en función de los días restantes
    const sortTasksByDaysRemaining = (tasks) => {
        return tasks.sort((a, b) => {
            const daysDifferenceA = calculateDaysDifference(a.startDate.toDate(), a.endDate.toDate());
            const daysDifferenceB = calculateDaysDifference(b.startDate.toDate(), b.endDate.toDate());
            return daysDifferenceA - daysDifferenceB; // Orden ascendente
        });
    };

    // Componente para mostrar el contador de días
    const DaysCounter = ({ startDate, endDate }) => {
        const daysDifference = calculateDaysDifference(startDate, endDate);
        // Determinar la clase CSS en función de los días restantes
        const textColorClass = daysDifference <= 5 ? 'red-text' : 'normal-text';
        return (
            <>
                Days remaining: <span className={textColorClass}>{daysDifference}</span>
            </>
        );
    };

    const handleOpenEditModal = (task) => {
        setEditingTask(task);
    };
    
    const handleEditTask = async (event) => {
        event.preventDefault(); // Prevenir el comportamiento predeterminado del formulario
    
        const db = getFirestore();
        const user = getAuth().currentUser;
        const userTaskRef = doc(db, `tasks/${user.uid}/userTasks`, editingTask.id);
    
        try {
            await updateDoc(userTaskRef, { 
                task: editingTask.task,
                tag: editingTask.tag 
            }); // Actualizar nombre, fechas y tag de la tarea
            setEditingTask(null); // Cerrar el modal después de la edición
            toast.success('Task updated correctly');
        } catch (error) {
            console.error('Error updating task:', error);
            toast.error('Something went wrong');
        }
    };    

    return (
        <div className="home-container">
            {/* Modal */}
            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={handleCloseModal}>&times;</span>
                        <h2>Add a new task 📋</h2>
                        <form onSubmit={handleAddTask}>
                            <div className="form-group">
                                <label htmlFor="taskName">Task Name 📄 :</label>
                                <input
                                    type="text"
                                    id="taskName"
                                    value={taskName}
                                    onChange={(e) => setTaskName(e.target.value)}
                                    required
                                    autoComplete='off'
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="startDate">Start Date 🗓️ :</label>
                                <DatePicker
                                    selected={startDate}
                                    onChange={(date) => setStartDate(date)}
                                    dateFormat="yyyy-MM-dd HH:mm"
                                    minDate={new Date()} // Establece la fecha mínima como la fecha actual
                                    required
                                    showTimeSelect // Habilita la selección de la hora
                                    timeFormat="HH:mm" // Establece el formato de la hora
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="endDate">End Date 🏁 :</label>
                                <DatePicker
                                    selected={endDate}
                                    onChange={(date) => setEndDate(date)}
                                    dateFormat="yyyy-MM-dd HH:mm"
                                    minDate={startDate} // Establece la fecha mínima como startDate
                                    showTimeSelect // Habilita la selección de la hora
                                    timeFormat="HH:mm" // Establece el formato de la hora
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="tag">Tag 🏷️ :</label>
                                <select id="tag" value={tag.value} onChange={handleTagChange} required>
                                    <option value="" disabled>Selecciona una opción</option>
                                    <option value="Unspecified">Unspecified</option>
                                    <option value="Low">Low</option>
                                    <option value="Normal">Normal</option>
                                    <option value="Important">Important</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                            </div>
                            <button type="submit" onClick={handleSubmit}>Add Task</button>
                        </form>
                    </div>
                </div>
            )}
            {editingTask && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setEditingTask(null)}>&times;</span>
                        <h2>Edit Task 📋</h2>
                        <form onSubmit={handleEditTask}>
                            <div className="form-group">
                                <label htmlFor="editTaskName">Task Name 📄 :</label>
                                <input
                                    type="text"
                                    id="editTaskName"
                                    value={editingTask.task}
                                    onChange={(e) => setEditingTask({ ...editingTask, task: e.target.value })}
                                    required
                                    autoComplete='off'
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="editTag">Tag 🏷️ :</label>
                                <select id="editTag" value={editingTask.tag} onChange={(e) => setEditingTask({ ...editingTask, tag: e.target.value })} required>
                                    <option value="Unspecified">Unspecified</option>
                                    <option value="Low">Low</option>
                                    <option value="Normal">Normal</option>
                                    <option value="Important">Important</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                            </div>
                            <button type="submit">Save Changes</button>
                        </form>
                    </div>
                </div>
            )}
            <div className="sign-out-container">
                <button onClick={signOut}>Sign Out</button>
            </div>
            <div className="columns-container">
                <div className="column" onDrop={(event) => handleDrop(event, 'todo')} onDragOver={(event) => allowDrop(event, 'todo')}>
                    <h2>📋 To Do 📋</h2>
                    {sortTasksByDaysRemaining(tasks.todo).map((task) => (
                        <div key={task.id} className="card" draggable="true" onDragStart={(event) => handleDragStart(event, task, 'todo')}>
                            <div className="task-content">
                                <p>
                                    <strong>{task.task}</strong>
                                    <br/>
                                    <br/>
                                    Start Date: {task.startDate.toDate().toLocaleString()}
                                    <br/>
                                    End Date: {task.endDate.toDate().toLocaleString()}
                                    <br/>
                                    <DaysCounter startDate={task.startDate.toDate()} endDate={task.endDate.toDate()} />
                                    <br/>
                                    <br/>
                                    Tag: <span className={task.tag.replace(' ', '-')}>{task.tag}</span>
                                </p>
                                <p>
                                    <FontAwesomeIcon className='edit' icon={faEdit} onClick={() => handleOpenEditModal(task)}/>
                                    <br/>
                                    <br/>
                                    <FontAwesomeIcon className='delete' icon={faTrash} onClick={() => handleDeleteTask('todo', task.id)} />
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="column" onDrop={(event) => handleDrop(event, 'doing')} onDragOver={(event) => allowDrop(event, 'doing')}>
                    <h2>👨🏻‍💻 Doing 👩🏻‍💻</h2>
                    {sortTasksByDaysRemaining(tasks.doing).map((task) => (
                        <div key={task.id} className="card" draggable="true" onDragStart={(event) => handleDragStart(event, task, 'doing')}>
                            <div className="task-content">
                                <p>
                                    <strong>{task.task}</strong>
                                    <br/>
                                    <br/>
                                    Start Date: {task.startDate.toDate().toLocaleString()}
                                    <br/>
                                    End Date: {task.endDate.toDate().toLocaleString()}
                                    <br/>
                                    <DaysCounter startDate={task.startDate.toDate()} endDate={task.endDate.toDate()} />
                                    <br/>
                                    <br/>
                                    Tag: <span className={task.tag.replace(' ', '-')}>{task.tag}</span>
                                </p>
                                <p>
                                    <FontAwesomeIcon className='edit' icon={faEdit} onClick={() => handleOpenEditModal(task)}/>
                                    <br/>
                                    <br/>
                                    <FontAwesomeIcon className='delete' icon={faTrash} onClick={() => handleDeleteTask('doing', task.id)} />
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="column" onDrop={(event) => handleDrop(event, 'done')} onDragOver={(event) => allowDrop(event, 'done')}>
                    <h2>✅ Done ✅</h2>
                    {sortTasksByDaysRemaining(tasks.done).map((task) => (
                        <div key={task.id} className="card" draggable="true" onDragStart={(event) => handleDragStart(event, task, 'done')}>
                            <div className="task-content">
                                <p>
                                    <strong>{task.task}</strong>
                                    <br/>
                                    <br/>
                                    Start Date: {task.startDate.toDate().toLocaleString()}
                                    <br/>
                                    End Date: {task.endDate.toDate().toLocaleString()}
                                    <br/>
                                    <DaysCounter startDate={task.startDate.toDate()} endDate={task.endDate.toDate()} />
                                    <br/>
                                    <br/>
                                    Tag: <span className={task.tag.replace(' ', '-')}>{task.tag}</span>
                                </p>
                                <p>
                                    <FontAwesomeIcon className='edit' icon={faEdit} onClick={() => handleOpenEditModal(task)}/>
                                    <br/>
                                    <br/>
                                    <FontAwesomeIcon className='delete' icon={faTrash} onClick={() => handleDeleteTask('done', task.id)} />
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="adding">
                <button className='add' onClick={handleOpenModal}><FontAwesomeIcon icon={faAdd} /></button>
            </div>
            {/* Muestra el indicador de arrastre solo cuando se arrastra sobre una columna */}
            {draggingOver && <div className="drag-indicator">{`Drop here into ${draggingOver}`}</div>}
        </div>
    );
};

export default Home;
