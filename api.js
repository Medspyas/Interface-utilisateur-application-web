const API_URL = "http://localhost:8000/api/v1/titles/";

// Fonction qui recupère les données de l'api.
async function fetchFilms(url) {
    try{
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erreurs lors de la récupération des données");
        const data = await response.json();        
        return data

    } catch (error){
        console.error(error)
        return null
    }  
}

//Fonction pour charger le meilleur selon sont score imbd
async function chargeMeilleurFilm() {
    const data = await fetchFilms(`${API_URL}?sort_by=-imdb_score&page_size=1`); 
    console.log("Données reçues pour le meilleur film :", data);   
    if (data && data.results && data.results.length > 0){
        const meilleurFilm = data.results[0];
        
        const details = await fetchFilms(meilleurFilm.url)

        
        document.querySelector(".meilleur-film-titre").textContent = "Meilleur film";
        document.querySelector(".card-body .meilleur-film-titre").textContent = details.title;         
        document.querySelector(".meilleur-film-resume").textContent = details.long_description;
        document.querySelector(".meilleur-film-image").src = details.image_url; 
        
        document.querySelector(".meilleur-film-boutton").addEventListener('click', () => {
            ouvrirModale(details);
        });
    } else {
        console.warn("Aucun film trouvé ou l'API est désactivé")
        return;
    }   

}


//charger les films les mieux notés

let loadingFilmsMieuxNotes = false;
async function chargerFilmsMieuxNotes() {
    if (loadingFilmsMieuxNotes) {
        console.warn("Le chargement des films mieux notés est déjà en cours");
        return;
    }

    loadingFilmsMieuxNotes = true;

    const data = await fetchFilms(`${API_URL}?sort_by=-imdb_score&page_size=6`);
    const filmsContainer = document.querySelector("#films-mieux-notés");
    filmsContainer.innerHTML= "";  


    
    if (data && data.results && data.results.length > 0){       
        const detailsArray = await Promise.all(
        data.results.map(film => {            
            return fetchFilms(film.url);
        })
    );
    console.log("Tous les détails des films ont été récupérés :", detailsArray);

        detailsArray.forEach(details =>  {           
            if (details){
                console.log("Ajout du film :", details.title, "dans le conteneur :", filmsContainer);
            const filmElement = document.createElement("div");
            filmElement.classList.add("fiche-de-film");
            filmElement.innerHTML =` 
                <img src="${details.image_url}" alt="Affcihe de ${details.title}" class="image-film">
                <div class="overlay">
                    <h3 class="titre-film">${details.title}</h3>
                    <button class="film-boutton">Détails</button>
                </div>
            `;
            filmsContainer.appendChild(filmElement);
            console.log(`Film ${details.title} ajouté au DOM avec succès.`);
            filmElement.querySelector(".film-boutton").addEventListener('click', () => {
                ouvrirModale(details);
            });
            }
        });
        
    }  else {
        console.warn("Aucun film trouvé ou l'API est désactivé")
    }   
        loadingFilmsMieuxNotes = false;
} 

// Charger les genres depuis l'API
async function chargerGenres() {
    try {
          let url = `http://localhost:8000/api/v1/genres/`;
          let allGenre = [];

        while(url){
        const data = await fetchFilms(url);
        if (data && data.results.length > 0) {            
            allGenre = allGenre.concat(data.results);
            url = data.next;
        }else{
            url = null;
        }
    } 

            const selecteur = document.getElementById("selecteur-de-catégorie")
            selecteur.innerHTML ="";
            allGenre.forEach(genre =>{
                const option = document.createElement("option");
                option.value = genre.name.toLowerCase();
                option.textContent = genre.name;
                selecteur.appendChild(option)
            });

            const premiereCategorie = selecteur.options[0].value;
            selecteur.value = premiereCategorie;
            chargerFilmsParCategorie(premiereCategorie, ".film-grille");        
    } catch (error){
        console.error("Erreur lors du chargement des genres:", error)
        return;
    }    
}


//Charger les films des catégories
async function chargerFilmsParCategorie(categorie, containerSelector) {     
    const data = await fetchFilms(`${API_URL}?genre=${categorie}&sort_by=-imdb_score&page_size=6`);    
    const filmsContainer = document.querySelector(containerSelector);
    

    
    filmsContainer.innerHTML= "";

    if (data && data.results && data.results.length > 0){
        const detailsArray = await Promise.all(data.results.map(film => fetchFilms(film.url)))

        detailsArray.forEach(details =>  {           
            if (details){
            console.log("Ajout du film :", details.title, "dans le conteneur :", filmsContainer);
            const filmElement = document.createElement("div");
            filmElement.classList.add("fiche-de-film");
            filmElement.innerHTML =` 
                <img src="${details.image_url}" alt="Affcihe de ${details.title}" class="image-film">
                <div class="overlay">
                    <h3 class="titre-film">${details.title}</h3>
                    <button class="film-boutton">Détails</button>
                </div>
            `;
            filmsContainer.appendChild(filmElement);

            filmElement.querySelector(".film-boutton").addEventListener('click', () => {
                ouvrirModale(details);
            });
            }
        });
        
    }  else {
        console.warn("Aucun film trouvé ou l'API est désactivé")
    }   return;    
} 


// Charger les films de la catégorie libre à partir du menu déroulant
document.getElementById("selecteur-de-catégorie").addEventListener("change", (event) => {
    const categorie = event.target.value;
    chargerFilmsParCategorie(categorie, "#films-autres");
});

// Fonction pour ouvrir la fenêtre modale avec les détails du film
function ouvrirModale(film) {
    const maxDescriptionLength = 300;
    let description = film.long_description || "Description non disponible";
    if (description.length > maxDescriptionLength){
        description = description.substring(0, maxDescriptionLength) + "...";
    }
    document.querySelector(".modale-titre").textContent = film.title;
    document.querySelector(".modale-info").innerHTML= `
    ${film.year || "Année inconnue"} - ${film.genres ? film.genres.join(', ') : "Genre incconus"}<br>
    ${film.rated || "Non classé"} - ${film.duration || "Durée inconnue"} (${film.countries ? film.countries.join(', '): "Pays inconnus"})<br>
    IMDB score : ${film.imdb_score || "NA"}/10
    `;
    document.querySelector(".modale-réalisateur").innerHTML = `<strong>Réalisaté par:</strong><br> ${film.directors.join(", ")}`;
    document.querySelector(".modale-image img").src = film.image_url;
    document.querySelector(".modale-résumé").textContent = description || "Description non disponible";
    document.querySelector(".modale-acteurs").innerHTML = `<strong>Avec:</strong><br> ${film.actors.join(", ")}`;

    document.getElementById("modale").style.display = "flex";
}

document.querySelector(".modale-boutton").addEventListener("click", () =>{
    document.getElementById("modale").style.display = "none";
});

window.addEventListener("click", (event) =>{
    const modale = document.getElementById("modale");
    if (event.target === modale){
        modale.style.display= "none";
    }
});

document.addEventListener("DOMContentLoaded", () => {
    chargeMeilleurFilm();
    chargerFilmsMieuxNotes();
    chargerGenres();

    chargerFilmsParCategorie("comedy", "#catégorie-comedie"); 

    chargerFilmsParCategorie("crime", "#catégorie-crime"); 

    document.getElementById("selecteur-de-catégorie").dispatchEvent(new Event('change'));
    
    
});

/*  chargeMeilleurFilm();
    chargerFilmsMieuxNotes();
    chargerGenres();

    chargerFilmsParCategorie("comedy", "#catégorie-comedie"); 
    chargerFilmsParCategorie("crime", "#catégorie-crime"); 

    document.getElementById("selecteur-de-catégorie").dispatchEvent(new Event('change'));*/