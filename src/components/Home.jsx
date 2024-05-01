import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc  } from 'firebase/firestore';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import '../css/Home.css';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const Home = () => {
    const [userAuthenticated, setUserAuthenticated] = useState(false);
    const [tasks, setTasks] = useState({
        todo: [],
        doing: [],
        done: []
    });
    const [newTask, setNewTask] = useState('');
    const [draggingOver, setDraggingOver] = useState(null);
    const [isEmpty, setIsEmpty] = useState(true);

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
                fetchedTasks[taskData.status].push({ id: doc.id, task: taskData.task });
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

    // Función para manejar el cambio en el input de nuevo task
    const handleInputChange = (event) => {
        const value = event.target.value;
        setNewTask(value);
        setIsEmpty(value.trim() === ''); // Verifica si el input está vacío
    };

    // Función para agregar una nueva tarea
    const handleAddTask = async (event) => {
        event.preventDefault();
        if (newTask.trim() !== '') {
            const db = getFirestore();
            const user = getAuth().currentUser;
            const userTasksRef = collection(db, `tasks/${user.uid}/userTasks`);
            await addDoc(userTasksRef, { task: newTask, status: 'todo' });
            setNewTask('');
            setIsEmpty(true);
        }
    };

    // Función para eliminar una tarea
    const handleDeleteTask = async (status, taskId) => {
        const db = getFirestore();
        const user = getAuth().currentUser;
        const userTaskRef = doc(db, `tasks/${user.uid}/userTasks`, taskId);
        await deleteDoc(userTaskRef);
    };

    // Función para cerrar sesión
    const signOut = () => {
        firebase.auth().signOut().then(() => {
            window.location.href = '/'; // Redirecciona a la página de inicio después de cerrar sesión
        }).catch((error) => {
            console.error(error);
        });
    };

    return (
        <div className="home-container">
            <div className="adding">
            <input
                className="search-input"
                type="text"
                value={newTask}
                onChange={handleInputChange}
                onKeyUp={(event) => {
                    if (event.key === 'Enter') {
                        handleAddTask(event);
                    }
                }}
                placeholder="Add a new task"
            />
                <button onClick={handleAddTask} disabled={isEmpty}>Add Task</button>
            </div>
            <div className="sign-out-container">
                <button onClick={signOut}>Sign Out</button>
            </div>
            <div className="columns-container">
                <div className="column" onDrop={(event) => handleDrop(event, 'todo')} onDragOver={(event) => allowDrop(event, 'todo')}>
                    <h2>ToDo</h2>
                    {tasks.todo.map((task) => (
                        <div key={task.id} className="card" draggable="true" onDragStart={(event) => handleDragStart(event, task, 'todo')}>
                            <div className="task-content">
                                <p>{task.task}</p>
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
                                <p>{task.task}</p>
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
                                <p>{task.task}</p>
                                <FontAwesomeIcon className='delete' icon={faTrash} onClick={() => handleDeleteTask('done', task.id)} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Muestra el indicador de arrastre solo cuando se arrastra sobre una columna */}
            {draggingOver && <div className="drag-indicator">{`Drop here into ${draggingOver}`}</div>}
        </div>
    );
};

export default Home;
