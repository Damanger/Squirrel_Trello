import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faAdd, faEdit, faUserPlus, faSave, faA } from '@fortawesome/free-solid-svg-icons';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
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
    const [showTeamworkersModal, setShowTeamworkersModal] = useState(false); // Nuevo estado para controlar la visibilidad del modal
    const [teamworkers, setTeamworkers] = useState([]); // Nuevo estado para almacenar la lista de correos electrónicos
    const [teamworkerEmail, setTeamworkerEmail] = useState(''); // Nuevo estado para el correo electrónico de cada teamworker
    const [showTeamContainer, setShowTeamContainer] = useState(false); // Estado para mostrar el contenido del equipo
    const [boardName, setBoardName] = useState(''); // Estado para el nombre del tablero
    const [renamed, setRenamed] = useState(false); // Estado para indicar si se ha cambiado el nombre del tablero
    const [savedBoardName, setSavedBoardName] = useState('');

    const handleChangeBoardName = (event) => {
        setBoardName(event.target.value);
    };

    const handleSaveBoardName = async () => {
        if (boardName.trim() !== '') {
            try {
                const auth = getAuth();
                const user = auth.currentUser;
                const db = getFirestore();
                const userUid = user.uid;
                const boardRef = doc(db, `boards/${userUid}`);
                await updateDoc(boardRef, { name: boardName });

                // Actualiza el estado para reflejar que el tablero ha sido renombrado
                setRenamed(true);
                // Actualiza el nombre del tablero guardado
                setSavedBoardName(boardName);
                // Borra el nombre del tablero del input
                setBoardName('');

                // Muestra el mensaje de éxito con el toast
                toast.success('Board name saved successfully');
            } catch (error) {
                console.error('Error saving board name:', error);
                toast.error('Error saving board name');
            }
        } else {
            toast.error('Please enter a valid board name');
        }
    };

    const handleToggleTeamContainer = () => {
        setShowTeamContainer(!showTeamContainer); // Cambiar el estado para mostrar u ocultar el contenido del equipo
    };

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
                fetchBoardName(user); // Llama a la función para cargar el nombre del tablero
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

    // Función para cargar el nombre del tablero desde la base de datos
    const fetchBoardName = async (user) => {
        const db = getFirestore();
        const userUid = user.uid;
        const boardRef = doc(db, `boards/${userUid}`);
        try {
            const boardSnapshot = await getDoc(boardRef);
            if (boardSnapshot.exists()) {
                const boardData = boardSnapshot.data();
                setSavedBoardName(boardData.name);
            } else {
                console.log('Board snapshot does not exist');
            }
        } catch (error) {
            console.error('Error fetching board name:', error);
        }
    };

    // Función para manejar la apertura del modal para agregar teamworkers
    const handleOpenTeamworkersModal = () => {
        setShowTeamworkersModal(true);
    };

    // Función para manejar el cierre del modal para agregar teamworkers
    const handleCloseTeamworkersModal = () => {
        setShowTeamworkersModal(false);
    };

    // Función para manejar el envío del formulario de teamworkers
    const handleSubmitTeamworkers = async (event) => {
        event.preventDefault();
        // Verificar si el campo de correo electrónico no está vacío
        if (teamworkerEmail.trim() !== '') {
            try {
                // Agregar el correo electrónico a la lista de teamworkers en el estado
                setTeamworkers([...teamworkers, teamworkerEmail]);
                // Guardar el correo electrónico en la base de datos
                await saveTeamworkerToDatabase(teamworkerEmail);
                // Limpiar el campo de correo electrónico después de agregar
                setTeamworkerEmail('');
                toast.success('Teamworker added successfully');
            } catch (error) {
                console.error('Error adding teamworker:', error);
                toast.error('Something went wrong');
            }
        } else {
            toast.error('Please enter a valid email address');
        }
    };

    // Función para guardar un teamworker en la base de datos
    const saveTeamworkerToDatabase = async (email) => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
            const db = getFirestore();
            const userUid = user.uid;
            const teamworkersRef = doc(db, `teamworkers/${userUid}`);
            try {
                // Obtener el documento existente de teamworkers
                const teamworkersDoc = await getDoc(teamworkersRef);
                if (teamworkersDoc.exists()) {
                    // Si el documento existe, actualizarlo agregando el nuevo correo electrónico a la lista existente
                    const existingEmails = teamworkersDoc.data().emails || [];
                    const updatedEmails = [...existingEmails, email];
                    await updateDoc(teamworkersRef, { emails: updatedEmails });
                } else {
                    // Si el documento no existe, crear uno nuevo con el correo electrónico inicial
                    await setDoc(teamworkersRef, { emails: [email] });
                }
            } catch (error) {
                console.error('Error adding teamworker to database:', error);
                throw error;
            }
        }
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
        <>
            <div className="sign-out-container">
                <button onClick={signOut}>Sign Out</button>
            </div>
            {/* Botón para cambiar entre Team y Work Alone */}
            <button onClick={handleToggleTeamContainer}>
                {showTeamContainer ? 'Work Alone' : 'Team Work'}
            </button>
            {/* Modal para agregar teamworkers */}
            {showTeamworkersModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={handleCloseTeamworkersModal}>&times;</span>
                        <h2>Add Teamworkers</h2>
                        <form onSubmit={handleSubmitTeamworkers}>
                            <div className="form-group">
                                <label htmlFor="teamworkerEmail">Email Address:</label>
                                <input
                                    type="email"
                                    id="teamworkerEmail"
                                    value={teamworkerEmail}
                                    onChange={(e) => setTeamworkerEmail(e.target.value)}
                                    required
                                    autoComplete='off'
                                />
                            </div>
                            <button type="submit">Add</button>
                        </form>
                    </div>
                </div>
            )}
            {/* Contenido de home-container o team-container según el estado */}
            {showTeamContainer ? (
                <>
                    <div className="adding">
                        <button className='add' onClick={handleOpenTeamworkersModal}><FontAwesomeIcon icon={faUserPlus}/></button>
                    </div>
                    {/* Contenido del equipo */} 
                    <div className="team-container">
                        <div className='centering'>
                            <input
                                className='input-team'
                                type="text"
                                placeholder={renamed ? 'Rename your board' : 'Enter a name for your board'}
                                value={boardName}
                                onChange={handleChangeBoardName}
                            />
                            <button onClick={handleSaveBoardName}><FontAwesomeIcon icon={faSave}/></button>
                        </div>
                        {/* Si el tablero ha sido renombrado o si se ha cargado un nombre del tablero desde la base de datos, mostrar el nombre */}
                        {(renamed || savedBoardName) && <h2 style={{color:'white', fontSize:'2rem'}}>{savedBoardName || boardName}</h2>}
                        <div className='centering'>
                            <input
                                className='input-team'
                                type='text'
                                placeholder='Type column name to add'
                            />
                            <button><FontAwesomeIcon icon={faAdd}/></button>
                        </div>
                        <h2 className='prueba'>🔧 Still working... 🔧</h2>
                    </div>
                </>
            ) : (
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
            )}
        </>
    );
};

export default Home;
