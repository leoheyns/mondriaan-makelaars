<?php
$VerkoperID = $_POST["VerkoperID"];
$Voornaam = $_POST["Voornaam"];
$Tussenvoegsel = $_POST["Tussenvoegsel"];
$Achternaam = $_POST["Achternaam"];
$Telefoonnummer = $_POST["Telefoonnummer"];
$EmailVerkoper = $_POST["EmailVerkoper"];
{
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
mysql_query("INSERT INTO verkopers VALUES ('$VerkoperID','$Voornaam','$Tussenvoegsel','$Achternaam','$Telefoonnummer','$EmailVerkoper')",$mysql) or die("De toevoegquery op de database is mislukt!"); 
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");

print("Hallo $Voornaam");
}
?>

