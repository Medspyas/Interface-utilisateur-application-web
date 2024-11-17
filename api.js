const API_URL = "http://localhost:8000/api/v1/titles/";
const IMAGE_PAR_DEFAUT = "./assets/pexels-cottonbro-3945317.jpg"

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
    if (data && data.results && data.results.length > 0){
        const meilleurFilm = data.results[0];

        const details = await fetchFilms(meilleurFilm.url)


        document.querySelector(".meilleur-film-titre").textContent = "Meilleur film";
        document.querySelector(".meilleur-film-titre").textContent = details.title;         
        document.querySelector(".meilleur-film-détails .meilleur-film-titre").textContent = details.title;         
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


async function chargerFilmsMieuxNotes() {
  
    const data = await fetchFilms(`${API_URL}?sort_by=-imdb_score&page_size=6`);
    const filmsContainer = document.querySelector("#films-mieux-notés");
    filmsContainer.innerHTML= "";  



    if (data && data.results && data.results.length > 0){       
        const detailsArray = await Promise.all(
        data.results.map(film => {            
            return fetchFilms(film.url);
        })
    );
    

        detailsArray.forEach(details =>  {           
            if (details){                
            const filmElement = document.createElement("div");
            filmElement.classList.add("fiche-de-film");
            
            let imageUrl = details.image_url;
            if(!imageUrl || imageUrl.trim() ==="" ){
                imageUrl = IMAGE_PAR_DEFAUT;
            }

            filmElement.innerHTML =` 
                <img src="${imageUrl}" alt="Affcihe de ${details.title}" class="image-film">
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
    }   
    return;
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
            const filmElement = document.createElement("div");
            filmElement.classList.add("fiche-de-film");

            let imageUrl = details.image_url;
            if(!imageUrl || imageUrl.trim() ==="" ){
                imageUrl = "./assets/pexels-cottonbro-3945317.jpg";                
            }
            

            filmElement.innerHTML =` 
                <img src="${imageUrl}" alt="Affcihe de ${details.title}" class="image-film">
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
        console.log(`Nombre total de films après ajout : ${filmsContainer.children.length}`);
        
    }  else {
        console.warn("Aucun film trouvé ou l'API est désactivé")
    }   
    
        
} 


// Charger les films de la catégorie libre à partir du menu déroulant


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

document.querySelector(".modale-fermer").addEventListener("click", () =>{
    document.getElementById("modale").style.display = "none";    
});

window.addEventListener("click", (event) =>{
    const modale = document.getElementById("modale");
    if (event.target === modale){
        modale.style.display= "none";
    }
});


function gererBoutonsVoirPlus() {
    // Tableau de paires ID pour chaque section de films
    const sections = [
        { filmsContainerId: "catégorie-comedie", voirPlusId: "voir-plus-comedie", voirMoinsId: "voir-moins-comedie" },
        { filmsContainerId: "films-mieux-notés", voirPlusId: "voir-plus", voirMoinsId: "voir-moins" },
        { filmsContainerId: "films-autres", voirPlusId: "voir-plus-autre", voirMoinsId: "voir-moins-autre" },
        { filmsContainerId: "catégorie-crime", voirPlusId: "voir-plus-crime", voirMoinsId: "voir-moins-crime" }
        // Ajoutez d'autres sections si nécessaire
    ];

    sections.forEach(section => {
        const filmsContainer = document.getElementById(section.filmsContainerId);
        const voirBoutonPlus = document.getElementById(section.voirPlusId);
        const voirBoutonMoins = document.getElementById(section.voirMoinsId);
        const films = Array.from(filmsContainer.children);

       

        function masquerFilmsSupplementaires() {
            let filmsAffiches = 2; // Par défaut,  2 films
        
            if (window.matchMedia("(min-width: 768px)").matches) {
                filmsAffiches = 4; // Pour les écrans moyens,  4 films
            }
            
            if (window.matchMedia("(min-width: 1024px)").matches) {
                filmsAffiches = films.length; 
            }
        
           
        
            films.forEach((film, index) => {                              
                
                if (index < filmsAffiches) {
                    film.style.display = "block";                    
                } else {
                    film.style.display = "none";                    
                }
            });

           
        
            if (filmsAffiches < films.length) {
                voirBoutonPlus.style.display = "block"; 
                voirBoutonMoins.style.display = "none"; 
            } else {
                voirBoutonPlus.style.display = "none"; 
                voirBoutonMoins.style.display = "none"; 
            }
        }

        function voirPlus() {
            films.forEach(film => (film.style.display = "block"));
            voirBoutonPlus.style.display = "none";
            voirBoutonMoins.style.display = "block";
        }

        function voirMoins() {
            masquerFilmsSupplementaires();
        }

        voirBoutonPlus.addEventListener("click", voirPlus);
        voirBoutonMoins.addEventListener("click", voirMoins);

        masquerFilmsSupplementaires();
        window.addEventListener("resize", masquerFilmsSupplementaires);
    });
}



async function chargerToutesLesCategories() {
    await chargerFilmsParCategorie("comedy", "#catégorie-comedie");
    await chargerFilmsParCategorie("crime", "#catégorie-crime");
    await chargerFilmsMieuxNotes(); // Charge aussi les films mieux notés
    // Appelle gererBoutonsVoirPlus après que tous les films soient chargés
    gererBoutonsVoirPlus();
}

document.getElementById("selecteur-de-catégorie").addEventListener("change", async (event) => {
    const categorie = event.target.value;
    await chargerFilmsParCategorie(categorie, "#films-autres");
    gererBoutonsVoirPlus();
});

document.addEventListener("DOMContentLoaded", () => {
    
    chargeMeilleurFilm();    
    chargerGenres();
    chargerToutesLesCategories();
    document.getElementById("selecteur-de-catégorie").dispatchEvent(new Event('change'));

    
});




