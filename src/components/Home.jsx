import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faAdd } from '@fortawesome/free-solid-svg-icons';
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
    const [tag, setTag] = useState(''); // Definir tag y su función de actualización

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
        if (taskName.trim() !== '' && tag.trim() !== '') {
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
                tag: tag, 
                status: 'todo' 
            });
            // Limpiar los campos del formulario después de agregar la tarea
            setTaskName('');
            setStartDate(new Date());
            setEndDate(new Date());
            setTag('');
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

    // Función para cerrar sesión
    const signOut = () => {
        firebase.auth().signOut().then(() => {
            console.log('Signed out');
        }).catch((error) => {
            console.error(error);
        });
    };

    return (
        <div className="home-container">
            {/* Modal */}
            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={handleCloseModal}>&times;</span>
                        <h2>Add a new task</h2>
                        <form onSubmit={handleAddTask}>
                            <div className="form-group">
                                <label htmlFor="taskName">Task Name:</label>
                                <input
                                    type="text"
                                    id="taskName"
                                    value={taskName}
                                    onChange={(e) => setTaskName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="startDate">Start Date:</label>
                                <DatePicker
                                    selected={startDate}
                                    onChange={(date) => setStartDate(date)}
                                    dateFormat="yyyy-MM-dd"
                                    minDate={new Date()} // Establece la fecha mínima como la fecha actual
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="endDate">End Date:</label>
                                <DatePicker
                                    selected={endDate}
                                    onChange={(date) => setEndDate(date)}
                                    dateFormat="yyyy-MM-dd"
                                    minDate={startDate} // Establece la fecha mínima como startDate
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="tag">Tag:</label>
                                <input
                                    type="text"
                                    id="tag"
                                    value={tag}
                                    onChange={(e) => setTag(e.target.value)}
                                />
                            </div>
                            <button type="submit" onClick={handleSubmit}>Add Task</button>
                        </form>
                    </div>
                </div>
            )}
            <div className="sign-out-container">
                <button onClick={signOut}>Sign Out</button>
            </div>
            <div className="columns-container">
                <div className="column" onDrop={(event) => handleDrop(event, 'todo')} onDragOver={(event) => allowDrop(event, 'todo')}>
                    <h2>ToDo</h2>
                    {tasks.todo.map((task) => (
                        <div key={task.id} className="card" draggable="true" onDragStart={(event) => handleDragStart(event, task, 'todo')}>
                            <div className="task-content">
                                <p>
                                    <strong>{task.task}</strong>
                                    <br />
                                    Start Date: {task.startDate.toDate().toDateString()}
                                    <br />
                                    End Date: {task.endDate.toDate().toDateString()}
                                    <br />
                                    <br />
                                    Tag: <span>{task.tag}</span>
                                </p>
                                <FontAwesomeIcon className='delete' icon={faTrash} onClick={() => handleDeleteTask('todo', task.id)} />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="column" onDrop={(event) => handleDrop(event, 'doing')} onDragOver={(event) => allowDrop(event, 'doing')}>
                    <h2>Doing</h2>
                    {tasks.doing.map((task) => (
                        <div key={task.id} className="card" draggable="true" onDragStart={(event) => handleDragStart(event, task, 'doing')}>
                            <div className="task-content">
                                <p>
                                    <strong>{task.task}</strong>
                                    <br />
                                    Start Date: {task.startDate.toDate().toDateString()}
                                    <br />
                                    End Date: {task.endDate.toDate().toDateString()}
                                    <br />
                                    <br />
                                    Tag: <span>{task.tag}</span>
                                </p>
                                <FontAwesomeIcon className='delete' icon={faTrash} onClick={() => handleDeleteTask('doing', task.id)} />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="column" onDrop={(event) => handleDrop(event, 'done')} onDragOver={(event) => allowDrop(event, 'done')}>
                    <h2>Done</h2>
                    {tasks.done.map((task) => (
                        <div key={task.id} className="card" draggable="true" onDragStart={(event) => handleDragStart(event, task, 'done')}>
                            <div className="task-content">
                                <p>
                                    <strong>{task.task}</strong>
                                    <br />
                                    Start Date: {task.startDate.toDate().toDateString()}
                                    <br />
                                    End Date: {task.endDate.toDate().toDateString()}
                                    <br />
                                    <br />
                                    Tag: <span>{task.tag}</span>
                                </p>
                                <FontAwesomeIcon className='delete' icon={faTrash} onClick={() => handleDeleteTask('done', task.id)} />
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
