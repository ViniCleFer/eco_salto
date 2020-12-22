import React, {useState, useEffect, ChangeEvent, FormEvent} from 'react';
import {Link, useHistory} from 'react-router-dom';
import {FiArrowLeft} from 'react-icons/fi';
import {Map, TileLayer, Marker, Popup} from 'react-leaflet';
import axios from 'axios';
import {LeafletMouseEvent} from 'leaflet'
import { toast } from "react-toastify";

import Dropzone from '../../components/Dropzone'

import logo from '../../assets/logo.svg';

import api from '../../services/api';

import './styles.css';

interface ItemsTypes {
  id: number;
  title: string;
  image_url: string
}

interface UfsTypes {
  sigla: string
}

interface CitiesTypes {
  nome: string
}
const CreatePoint: React.FC = () => {
  const [itemsExists, setItemsExists] = useState<ItemsTypes[]>([]);
  const [ufs, setUfs] = useState<UfsTypes[]>([]);
  const [cities, setCities] = useState<CitiesTypes[]>([]);
  const [selectedUf, setSelectedUf] = useState('0');
  const [selectedCity, setSelectedCity] = useState('0');
  const [popupLocation, setPopupLocation] = useState('Você está aqui!')
  const [initialLocation, setInitialLocation] = useState<[number, number]>([0, 0]);
  const [selectedLocation, setSelectedLocation] = useState<[number, number]>([0, 0]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedFile, setSelectedFile] = useState<File>();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
  });

  const history = useHistory();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const {latitude, longitude} = position.coords;

      setInitialLocation([latitude, longitude]);
    })
  }, []);

  useEffect(() => {
    if (initialLocation.length > 0 && selectedLocation[0] === 0) {
      setSelectedLocation(initialLocation)
    }
  }, [selectedLocation, initialLocation]);

  function handlePlaceName() {
    if ( initialLocation !== selectedLocation) {
      return setPopupLocation('Nome do Lugar');
    }
    return setPopupLocation('Você está aqui!');
  };

  useEffect(() => {
    async function loadItems() {
      const response = await api.get('items');

      setItemsExists(response.data);
    }

    loadItems();
  }, []);

  useEffect(() => {
    async function loadStates() {
      const response = await axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados'); 

      setUfs(response.data);
    }

    loadStates();
  }, []);

  useEffect(() => {
    async function loadCities() {
      const response = await axios.get(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`
      ); 

      setCities(response.data);
    }

    loadCities();
  }, [selectedUf]);

  function HandleMapClick(event: LeafletMouseEvent) {
    setSelectedLocation([event.latlng.lat, event.latlng.lng]);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const {name, value} = event.target;

    setFormData({
      ...formData,
      [name]: value,
    })
  }
 
  function handleSelectedItem(id: number) {
    const alreadySelected = selectedItems.findIndex(item => item === id);

    if (alreadySelected >= 0) {
      const filteredItems = selectedItems.filter(item => item !== id);

      setSelectedItems(filteredItems);
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const {name, email, whatsapp} = formData;
    const uf = selectedUf;
    const city = selectedCity;
    const [latitude, longitude] = selectedLocation;
    const items = selectedItems;

    const data = new FormData();

    data.append('name', name);
    data.append('email', email);
    data.append('whatsapp', whatsapp);
    data.append('uf', uf);
    data.append('city', city);
    data.append('latitude', String(latitude));
    data.append('longitude', String(longitude));
    data.append('items', items.join(','));

    if (selectedFile) {
      data.append('image', selectedFile);
    }

    const responseData = await api.post('points', data);

    if (responseData.status === 200) {
      toast.success("Cadastro realizado, Ponto de coleta criado com sucesso!");
      history.push('/');
    } else {
      toast.error("Falha no cadastro, verifique os dados preenchidos.");
    }
  }
 
  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Escoleta"/>

        <Link to="/">
            <FiArrowLeft />
          <strong>Voltar para Home</strong>
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>Cadastro do <br /> ponto de coleta</h1>

        <Dropzone onFileUploaded={setSelectedFile} />

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input type="text" name="name" id="name" onChange={handleInputChange} />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input type="email" name="email" id="email" onChange={handleInputChange} />
            </div>
            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input type="text" name="whatsapp" id="whatsapp" onChange={handleInputChange} />
          </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione um endereço no mapa</span>
          </legend>

          <Map center={initialLocation} zoom={15} onClick={HandleMapClick}>
            <TileLayer
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* <HandleMapClick /> */}
            <Marker position={selectedLocation} onclick={handlePlaceName}>
              <Popup>
                {popupLocation}
              </Popup>
            </Marker>
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select name="uf" id="uf" value={selectedUf} onChange={(u) => setSelectedUf(u.target.value)}>
                <option value="0">Selecione uma UF</option>
                {ufs.map(uf => (
                  <option key={uf.sigla} value={uf.sigla}>{uf.sigla}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select name="city" id="city" value={selectedCity} onChange={(c) => setSelectedCity(c.target.value)}>
                <option value="0">Selecione uma cidade</option>
                {cities.map(city => (
                  <option key={city.nome} value={city.nome}>{city.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Itens de coleta</h2>
            <span>Selecione um ou mais itens abaixo</span>
          </legend>

          <ul className="items-grid">
            {itemsExists.map(item => (
              <li
                key={item.id}
                onClick={() => handleSelectedItem(item.id)}
                className={selectedItems.includes(item.id) ? 'selected' : ''}
              >
                <img src={item.image_url} alt={item.title} />
                <span>{item.title}</span>
              </li>
            ))}
           
          </ul>
        </fieldset>

        <button type="submit">
          Cadastrar ponto de coleta
        </button>
      </form>
    </div>
  );
}

export default CreatePoint;