<html>
    <head>
        <link href="https://fonts.googleapis.com/css?family=Jim+Nightshade|Roboto:100" rel="stylesheet">
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="">
        <meta name="author" content="">
        <title>Starter Template for Bootstrap</title>
        <!-- Bootstrap core CSS -->
        <link href="bootstrap/css/bootstrap.css" rel="stylesheet">
        <!-- Custom styles for this template -->
        <link href="starter-template.css" rel="stylesheet">
        <!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
        <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
      <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
 </head>
 
<?php
$PandID = $_GET["PandID"];
$mysql = mysql_connect("185.56.145.84","retorq1q","cnxdWK4H") or die("Fout: Er is geen verbinding met de MySQL-server tot stand gebracht!");
mysql_select_db("retorq1q_makelaars",$mysql) or die("Fout: Het openen van de database is mislukt!");
$resultaat = mysql_query("SELECT * FROM panden Where PandID = $PandID",$mysql) or die("De query op de database is mislukt!");
mysql_close($mysql) or die("Het verbreken van de verbinding met de MySQL-server is mislukt!");

print("<table><tr><td>Pand naam</td>
		<td>Verkoopprijs</td>
		<td>RegioPand</td><td>Type</td>
		<td>Postcode</td><td>Plaats</td><td>Oppervlakte</td><td>Slaapkamers</td>
		<td>Richting tuin</td><td>Plaatje</td></tr>");
	list($PandID,$PandNaam,$VerkoperID,$VerkoopDatum,$Inkoopprijs,$Verkoopprijs,$Verkocht,$RegioPand,$Type,$Plaatje,$Postcode,$Plaats,$Oppervlakte,$Slaapkamers,$Richting,$Beschrijving) = mysql_fetch_row($resultaat);
	$Image = "<img src=$Plaatje alt=\"plaatje\" style=\"width:200;height:100;\">";
	  print("<tr><td>$PandNaam</td>
		<td>$Verkoopprijs</td>
		<td>$RegioPand</td><td>$Type</td>
		<td>$Postcode</td><td>$Plaats</td><td>$Oppervlakte</td><td>$Slaapkamers</td>
		<td>$Richting</td><td>$Image</td></tr>");
print("</table>");


print("$Beschrijving");
?>

<br /> <br />
		<button onclick="history.go(-1);" class="verzendknop">Back </button>
</html>